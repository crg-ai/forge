# TodoMVC 任务管理示例

使用 DDD 重新实现的经典 TodoMVC，展示轻量级 DDD 实践。

## 🎯 功能特性

- ✅ 添加任务
- ✅ 完成/取消完成任务
- ✅ 编辑任务
- ✅ 删除任务
- ✅ 过滤（全部/活跃/已完成）
- ✅ 清除已完成任务

## 📐 领域模型

### Todo Entity

```typescript
class Todo extends Entity<TodoProps> {
  private title: string
  private completed: boolean

  complete(): void
  uncomplete(): void
  updateTitle(newTitle: string): void
}
```

### TodoList Aggregate

```typescript
class TodoList extends AggregateRoot<TodoListProps> {
  private todos: Todo[]

  addTodo(title: string): void
  removeTodo(todoId: string): void
  clearCompleted(): void
  getActiveTodos(): Todo[]
  getCompletedTodos(): Todo[]
}
```

## 📚 学习要点

1. **轻量级 DDD** - 不过度设计
2. **Repository 模式** - LocalStorage 持久化
3. **前端集成** - 与 React 状态管理结合

适合 DDD 初学者入门。
