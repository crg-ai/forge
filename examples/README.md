# Forge 示例项目

本目录包含完整的 DDD 实战示例，展示如何使用 Forge 框架构建真实的前端应用。

## 📚 示例列表

### 1. [电商系统 (E-Commerce)](./e-commerce/)

**复杂度**: ⭐⭐⭐⭐⭐

完整的电商系统示例，展示复杂的业务逻辑和聚合协作。

**核心概念**:

- 订单聚合（Order Aggregate）
- 商品目录（Product Catalog）
- 购物车（Shopping Cart）
- 支付处理（Payment Processing）
- 库存管理（Inventory Management）

**学习要点**:

- 复杂聚合设计
- 聚合间通信（领域事件）
- 事务一致性
- 业务规则封装
- CQRS 模式应用

[查看详情 →](./e-commerce/README.md)

---

### 2. [博客系统 (Blog)](./blog/)

**复杂度**: ⭐⭐⭐⭐☆

博客平台示例，展示内容管理和用户交互。

**核心概念**:

- 文章聚合（Article Aggregate）
- 评论管理（Comments）
- 用户系统（Users）
- 标签分类（Tags & Categories）
- 发布流程（Publishing Workflow）

**学习要点**:

- 聚合根设计
- 实体关系处理
- 富领域模型
- 状态机模式
- 乐观并发控制

[查看详情 →](./blog/README.md)

---

### 3. [任务管理 (TodoMVC)](./todo-mvc/)

**复杂度**: ⭐⭐⭐☆☆

经典的 TodoMVC 示例，使用 DDD 重新实现。

**核心概念**:

- 任务实体（Todo Entity）
- 任务列表聚合（TodoList Aggregate）
- 过滤和排序（Filtering & Sorting）
- 本地持久化（Local Storage Repository）

**学习要点**:

- 轻量级 DDD 实践
- 值对象使用
- Repository 模式
- 前端状态管理集成

[查看详情 →](./todo-mvc/README.md)

---

## 🚀 快速开始

### 运行示例

每个示例都是独立的项目，可以单独运行：

```bash
# 进入示例目录
cd examples/e-commerce

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test
```

### 学习路径

推荐的学习顺序：

1. **初学者**: 从 TodoMVC 开始
   - 理解基础的 Entity 和 ValueObject
   - 学习 Repository 模式
   - 掌握简单的聚合设计

2. **进阶**: 学习 Blog 系统
   - 掌握复杂的聚合根
   - 理解聚合边界
   - 学习状态机和工作流

3. **高级**: 研究 E-Commerce 系统
   - 多聚合协作
   - 领域事件驱动
   - 事务一致性处理
   - CQRS 和事件溯源

## 📖 代码结构

所有示例都遵循统一的 DDD 分层架构：

```
example/
├── domain/              # 领域层
│   ├── entities/       # 实体
│   ├── value-objects/  # 值对象
│   ├── aggregates/     # 聚合根
│   ├── services/       # 领域服务
│   ├── events/         # 领域事件
│   └── repositories/   # 仓储接口
├── application/        # 应用层
│   ├── use-cases/      # 用例
│   ├── dto/            # 数据传输对象
│   └── services/       # 应用服务
├── infrastructure/     # 基础设施层
│   ├── repositories/   # 仓储实现
│   ├── api/            # API 客户端
│   └── persistence/    # 持久化
├── presentation/       # 表现层
│   ├── components/     # UI 组件
│   ├── pages/          # 页面
│   ├── hooks/          # React Hooks
│   └── stores/         # 状态管理
└── tests/              # 测试
    ├── unit/           # 单元测试
    ├── integration/    # 集成测试
    └── e2e/            # 端到端测试
```

## 💡 关键特性展示

### Entity 使用示例

```typescript
// domain/entities/User.ts
class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: EntityId) {
    super(props, id)
  }

  static create(props: CreateUserProps): Result<User> {
    const emailResult = Email.create(props.email)
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error)
    }

    return Result.ok(
      new User({
        email: emailResult.value,
        username: props.username
      })
    )
  }

  changeEmail(newEmail: Email): void {
    this.props.email = newEmail
    this.addDomainEvent(new EmailChanged(this.id, newEmail))
  }
}
```

### ValueObject 使用示例

```typescript
// domain/value-objects/Money.ts
class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props)
  }

  static create(amount: number, currency: string): Result<Money> {
    if (amount < 0) {
      return Result.fail('Amount cannot be negative')
    }
    return Result.ok(new Money({ amount, currency }))
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch')
    }
    return new Money({
      amount: this.amount + other.amount,
      currency: this.currency
    })
  }
}
```

### AggregateRoot 使用示例

```typescript
// domain/aggregates/Order.ts
class Order extends AggregateRoot<OrderProps> {
  private constructor(props: OrderProps, id?: EntityId) {
    super(props, id)
  }

  static create(customerId: string): Result<Order> {
    const order = new Order({
      customerId,
      items: [],
      status: OrderStatus.Pending,
      createdAt: new Date()
    })

    order.addDomainEvent(new OrderCreated(order.id, customerId))
    return Result.ok(order)
  }

  addItem(product: Product, quantity: number): void {
    // 业务规则：订单确认后不能添加商品
    if (this.status !== OrderStatus.Pending) {
      throw new DomainError('Cannot add items to confirmed order')
    }

    // 业务规则：不能添加重复商品
    if (this.hasItem(product.id)) {
      throw new DomainError('Item already in order')
    }

    const item = OrderItem.create(product, quantity)
    this.props.items.push(item)

    this.addDomainEvent(new ItemAdded(this.id, product.id, quantity))
  }

  confirm(): void {
    // 业务规则：至少有一个商品
    if (this.props.items.length === 0) {
      throw new DomainError('Order must have at least one item')
    }

    this.props.status = OrderStatus.Confirmed
    this.addDomainEvent(new OrderConfirmed(this.id, this.calculateTotal()))
  }
}
```

## 🧪 测试示例

每个示例都包含完整的测试：

```typescript
// tests/domain/aggregates/Order.test.ts
describe('Order Aggregate', () => {
  describe('create', () => {
    it('should create order with pending status', () => {
      const result = Order.create('C1')

      expect(result.isSuccess).toBe(true)
      expect(result.value.status).toBe(OrderStatus.Pending)
    })
  })

  describe('addItem', () => {
    it('should add item to order', () => {
      const order = Order.create('C1').value
      const product = Product.create({ price: 100 }).value

      order.addItem(product, 2)

      expect(order.itemCount).toBe(1)
      expect(order.calculateTotal().amount).toBe(200)
    })

    it('should not allow adding items to confirmed order', () => {
      const order = Order.create('C1').value
      order.addItem(Product.create({ price: 100 }).value, 1)
      order.confirm()

      expect(() => {
        order.addItem(Product.create({ price: 50 }).value, 1)
      }).toThrow('Cannot add items to confirmed order')
    })
  })
})
```

## 📚 相关资源

- [Forge 文档](../README.md)
- [DDD 模式指南](../.claude/rules/ddd-patterns.md)
- [最佳实践](../docs/best-practices.md)
- [API 参考](../docs/api-reference.md)

## 🤝 贡献

欢迎贡献新的示例！请确保：

1. 遵循 DDD 原则
2. 包含完整测试（100% 覆盖率）
3. 提供详细的 README
4. 代码风格一致

## 📄 许可证

所有示例代码使用 MIT 许可证。
