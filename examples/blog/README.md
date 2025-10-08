# Blog 博客系统示例

使用 DDD 构建的内容管理系统，展示文章发布、评论管理等功能。

## 🎯 功能特性

- ✅ 文章管理（Article Management）
- ✅ 评论系统（Comments）
- ✅ 用户系统（Users）
- ✅ 标签分类（Tags & Categories）
- ✅ 发布流程（Publishing Workflow）
- ✅ 草稿保存（Draft Saving）

## 📐 领域模型

### 核心聚合

#### Article Aggregate（文章聚合）

```typescript
class Article extends AggregateRoot<ArticleProps> {
  private title: string
  private content: string
  private status: ArticleStatus // Draft, Published, Archived
  private comments: Comment[]

  publish(): void
  archive(): void
  addComment(author: User, content: string): void
  updateContent(title: string, content: string): void
}
```

### 状态机

```
Draft (草稿) → Published (已发布) → Archived (已归档)
     ↓                ↓
     └────────────────┘
      (可以相互转换)
```

## 🏗️ 架构设计

详细的分层架构和文件组织，请查看源代码。

## 📚 学习要点

1. **富领域模型** - Article 包含复杂的业务逻辑
2. **状态机模式** - 文章状态流转
3. **实体关系** - Article 和 Comment 的一对多关系
4. **乐观并发** - 使用版本号防止冲突

更多详情请参考源代码和测试。
