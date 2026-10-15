/**
 * Unit tests for backend/api/src/core/telemetry/EventTracer.js
 *
 * Coverage:
 *   - constructor: initializes tracer
 *   - startTrace: creates trace span
 *   - endTrace: closes span
 *   - getTrace: retrieves active trace
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
// backend/api/test/unit/telemetry_EventTracer.test.js

import { describe, it, expect, vi } from 'vitest';
import { 
  wrapPublish, 
  wrapSubscribe, 
  wrapEventHandler, 
  traceEventBus 
} from '../../src/core/telemetry/EventTracer.js';

describe('EventTracer Telemetry Module', () => {
  it('should wrap publish methods and trace event publication', async () => {
    const mockPublish = vi.fn().mockResolvedValue({ success: true });
    const wrappedPublish = wrapPublish('order.created', mockPublish);

    const result = await wrappedPublish({ orderId: '123' });

    expect(mockPublish).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledWith({ orderId: '123' });
    expect(result).toEqual({ success: true });
  });

  it('should wrap subscribe handlers and record execution metrics', async () => {
    const mockHandler = vi.fn().mockResolvedValue(true);
    const wrappedHandler = wrapSubscribe('order.created', mockHandler);

    await wrappedHandler({ orderId: '123' });

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith({ orderId: '123' });
  });

  it('should wrap generic event handlers correctly', async () => {
    const mockHandler = vi.fn().mockReturnValue('processed');
    const wrapped = wrapEventHandler('payment.processed', mockHandler);

    const res = wrapped({ paymentId: 'p-99' });

    expect(res).toBe('processed');
    expect(mockHandler).toHaveBeenCalledWith({ paymentId: 'p-99' });
  });

  it('should attach trace event bus telemetry without disrupting message flow', () => {
    const mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn()
    };

    const tracedBus = traceEventBus(mockEventBus);

    expect(tracedBus).toBeDefined();
    expect(typeof tracedBus.publish).toBe('function');
    expect(typeof tracedBus.subscribe).toBe('function');
  });
});
const mockStartSpan = vi.fn(() => ({ setStatus: vi.fn(), end: vi.fn(), setAttributes: vi.fn(), setAttribute: vi.fn() }));
vi.mock('@opentelemetry/api', () => ({ context: { active: vi.fn(() => ({})) }, trace: { getTracer: vi.fn(() => ({ startSpan: mockStartSpan })) }, SpanStatusCode: { OK: 0, ERROR: 1 } }));

const EventTracer = (await import('../../src/core/telemetry/EventTracer.js')).EventTracer;

describe('EventTracer', () => {
  beforeEach(() => { vi.clearAllMocks(); mockStartSpan.mockReturnValue({ setStatus: vi.fn(), end: vi.fn(), setAttributes: vi.fn(), setAttribute: vi.fn() }); });

  describe('constructor', () => {
    it('creates tracer instance', () => { expect(new EventTracer('test-service')).toBeTruthy(); });
  });

  describe('startTrace', () => {
    it('starts a trace span', () => {
      new EventTracer('test-service').startTrace('test-span', { attr: 'value' });
      expect(mockStartSpan).toHaveBeenCalledWith('test-span', expect.anything());
    });
  });

  describe('endTrace', () => {
    it('ends a trace span', () => {
      const tracer = new EventTracer('test-service');
      const span = tracer.startTrace('test-span');
      tracer.endTrace(span);
      expect(span.end).toHaveBeenCalled();
    });
  });

  describe('getTrace', () => {
    it('returns tracer instance', () => { expect(new EventTracer('test-service').getTrace()).toBeTruthy(); });
  });
});
