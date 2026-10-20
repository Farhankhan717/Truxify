import { describe, it, expect, beforeEach } from 'vitest';
import RenderScheduler from '../scheduler/RenderScheduler.js';

// backend/scheduler/RenderScheduler.test.js (Excerpt)

describe('RenderScheduler Cancellation & Unblocking', () => {
  it('unlinks cancelled task and lets unblocked dependents become schedulable', () => {
    const scheduler = new RenderScheduler();
    
    // Setup tasks with dependencies
    scheduler.addTask('taskA', () => {});
    scheduler.addTask('taskB', ['taskA'], () => {}); // depends on A

    // Cancel taskA
    scheduler.cancel('taskA');

    // Assertions reflecting the unblocking contract
    expect(scheduler.taskMap.has('taskA')).toBe(false); // Cancelled task leaves taskMap
    expect(scheduler.taskMap.has('taskB')).toBe(true);  // Dependent survives
    
    // taskB should now have no remaining dependencies and be ready for scheduling
    expect(scheduler.getSchedulableTasks()).toContain('taskB');
  });

  it('retains dependent in taskMap with surviving dependencies still blocking execution', () => {
    const scheduler = new RenderScheduler();
    
    scheduler.addTask('taskA', () => {});
    scheduler.addTask('taskB', () => {});
    scheduler.addTask('taskC', ['taskA', 'taskB'], () => {}); // depends on both A and B

    // Cancel only taskA
    scheduler.cancel('taskA');

    // Assertions
    expect(scheduler.taskMap.has('taskA')).toBe(false); // taskA is removed
    expect(scheduler.taskMap.has('taskC')).toBe(true);  // dependent C survives
    
    // taskC should still be blocked because taskB is uncompleted/un-cancelled
    expect(scheduler.getSchedulableTasks()).not.toContain('taskC');
  });
});

    it('releases dependents when a dependency is cancelled', () => {
        const depId = scheduler.schedule(() => 'dep', 2);
        const taskId = scheduler.schedule(() => 'task', 2);
        scheduler.addDependency(taskId, depId);

        expect(scheduler.getTask(taskId).dependencies).toContain(depId);

        const cancelled = scheduler.cancel(depId);
        expect(cancelled).toBe(true);

        const dependent = scheduler.getTask(taskId);
        expect(dependent).toBeDefined();
        expect(dependent.dependencies).not.toContain(depId);
        expect(scheduler.areDependenciesMet(dependent)).toBe(true);
    });

    it('removes the cancelled task and unblocked dependents from taskMap', () => {
        const depId = scheduler.schedule(() => 'dep', 2);
        const taskId = scheduler.schedule(() => 'task', 2);
        scheduler.addDependency(taskId, depId);

        scheduler.cancel(depId);

        expect(scheduler.getTask(depId)).toBeUndefined();
        expect(scheduler.getTask(taskId)).toBeUndefined();
        expect(scheduler.taskMap.size).toBe(0);
    });

    it('prunes a dependent blocked forever by a cancelled dependency', () => {
        const depId = scheduler.schedule(() => 'dep', 2);
        const taskId = scheduler.schedule(() => 'task', 2);
        const otherDepId = scheduler.schedule(() => 'other', 2);
        scheduler.addDependency(taskId, depId);
        scheduler.addDependency(taskId, otherDepId);

        scheduler.cancel(depId);

        expect(scheduler.getTask(depId)).toBeUndefined();
        expect(scheduler.getTask(otherDepId)).toBeDefined();
        expect(scheduler.getTask(taskId)).toBeUndefined();
        expect(scheduler.taskMap.size).toBe(1);
    });
});
