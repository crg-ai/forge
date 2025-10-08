# Refactoring Workflow

安全、系统化的代码重构工作流。

## 重构原则

> "重构是在不改变软件可观察行为的前提下，改善其内部结构" - Martin Fowler

**重构三定律**：

1. 红灯不重构（测试必须通过）
2. 小步快跑（一次只做一个改动）
3. 持续验证（每次改动后都运行测试）

## 执行步骤

### 1. 确保测试覆盖率充足

在重构前，必须有完善的测试保护网。

```bash
# 检查当前覆盖率
npm run test:coverage

# 目标：100% 覆盖率
# 如果不足，先补充测试
```

**检查清单**：

- [ ] 所有公共 API 都有测试
- [ ] 边界情况都有覆盖
- [ ] 测试通过率 100%
- [ ] 覆盖率达到 100%

### 2. 创建重构分支

```bash
git checkout main
git pull origin main
git checkout -b refactor/[描述]

# 例如：
git checkout -b refactor/extract-validation-logic
git checkout -b refactor/simplify-entity-base-class
```

### 3. 识别重构目标

常见的重构场景：

#### 代码异味识别

- **重复代码**：多处出现相同或相似的代码
- **过长函数**：函数超过 30 行
- **过大类**：类超过 200 行或职责过多
- **过长参数列表**：函数参数超过 3 个
- **发散式变化**：一个类因多种原因而修改
- **霰弹式修改**：一个变更需要修改多个类
- **依恋情结**：函数过度使用其他类的数据
- **数据泥团**：总是一起出现的数据项
- **基本类型偏执**：用基本类型代替小对象
- **过度使用 Switch**：复杂的条件逻辑

### 4. 选择重构手法

#### 提取方法（Extract Method）

```typescript
// Before
class Order {
  printDetails() {
    console.log(`Order ID: ${this.id}`)
    console.log(`Customer: ${this.customer.name}`)
    console.log(`Total: ${this.items.reduce((sum, item) => sum + item.price, 0)}`)
  }
}

// After
class Order {
  printDetails() {
    this.printHeader()
    this.printTotal()
  }

  private printHeader() {
    console.log(`Order ID: ${this.id}`)
    console.log(`Customer: ${this.customer.name}`)
  }

  private printTotal() {
    console.log(`Total: ${this.calculateTotal()}`)
  }

  private calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0)
  }
}
```

#### 引入参数对象（Introduce Parameter Object）

```typescript
// Before
function createOrder(
  customerId: string,
  items: Item[],
  shippingAddress: string,
  billingAddress: string,
  paymentMethod: string
) {
  // ...
}

// After
interface OrderRequest {
  customerId: string
  items: Item[]
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: PaymentMethod
}

function createOrder(request: OrderRequest) {
  // ...
}
```

#### 用多态替换条件表达式（Replace Conditional with Polymorphism）

```typescript
// Before
class Price {
  calculate(type: string): number {
    switch (type) {
      case 'regular':
        return this.basePrice
      case 'premium':
        return this.basePrice * 1.5
      case 'vip':
        return this.basePrice * 2
      default:
        throw new Error('Unknown type')
    }
  }
}

// After
abstract class PriceStrategy {
  abstract calculate(basePrice: number): number
}

class RegularPrice extends PriceStrategy {
  calculate(basePrice: number): number {
    return basePrice
  }
}

class PremiumPrice extends PriceStrategy {
  calculate(basePrice: number): number {
    return basePrice * 1.5
  }
}

class VIPPrice extends PriceStrategy {
  calculate(basePrice: number): number {
    return basePrice * 2
  }
}
```

### 5. 执行重构（小步前进）

**重构步骤模板**：

1. 运行测试，确保全部通过 ✅
2. 做一个小的改动
3. 运行测试，确保仍然通过 ✅
4. 提交改动（可选）
5. 重复步骤 2-4

```bash
# 每次小改动后
npm run test:run

# 可以频繁提交
git add .
git commit -m "refactor: extract calculateTotal method"
```

### 6. 持续验证

在重构过程中，持续运行以下检查：

```bash
# 快速反馈循环（每次改动后）
npm run test -- --run [相关测试文件]

# 完整验证（重要节点）
npm run test:run
npm run typecheck
npm run lint
npm run build

# 性能检查（重构完成后）
npm run size
npm run analyze
```

### 7. 代码审查

```bash
# 使用 code-reviewer Agent
@code-reviewer 请审查这次重构，关注：
1. 是否保持了原有行为
2. 代码可读性是否提升
3. 是否引入了新的问题
4. 测试覆盖率是否保持
```

### 8. 性能验证

确保重构没有降低性能：

```bash
# 运行性能测试（如果有）
npm run bench

# 检查包体积
npm run size

# 对比重构前后
```

### 9. 提交重构

```bash
# 查看所有变更
git diff main...HEAD

# 整理提交历史（可选）
git rebase -i main

# 推送
git push -u origin refactor/[描述]

# 创建 PR
gh pr create --title "refactor: [简要描述]" --body "
## Refactoring Goal
重构目标和动机

## Changes
- 提取了 XXX 方法
- 简化了 YYY 逻辑
- 移除了重复代码

## Benefits
- 提高了代码可读性
- 降低了复杂度
- 便于后续扩展

## Verification
- [x] 所有测试通过
- [x] 覆盖率保持 100%
- [x] 类型检查通过
- [x] 代码检查通过
- [x] 包体积未增加
- [x] 性能未下降

🤖 Generated with [Claude Code](https://claude.com/claude-code)
"
```

## 重构检查清单

### 前置条件

- [ ] 测试覆盖率充足（100%）
- [ ] 所有测试通过
- [ ] 创建了重构分支
- [ ] 理解了要重构的代码

### 重构过程

- [ ] 识别了代码异味
- [ ] 选择了合适的重构手法
- [ ] 小步前进，频繁测试
- [ ] 每次改动后测试都通过
- [ ] 保持了原有行为

### 后置验证

- [ ] 所有测试仍然通过
- [ ] 覆盖率保持不变
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] 包体积未增加
- [ ] 性能未下降
- [ ] 代码可读性提升

## 常见重构模式

### 1. DDD 领域模型重构

#### 提取值对象

```typescript
// Before
class User {
  email: string

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)
  }
}

// After
class Email extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props)
  }

  static create(email: string): Result<Email> {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Result.fail('Invalid email format')
    }
    return Result.ok(new Email({ value: email }))
  }
}

class User {
  email: Email
}
```

#### 提取领域服务

```typescript
// Before
class Order {
  calculateShipping(): Money {
    // 复杂的运费计算逻辑
  }
}

// After
class ShippingCalculator {
  calculate(order: Order): Money {
    // 复杂的运费计算逻辑
  }
}

class Order {
  calculateShipping(calculator: ShippingCalculator): Money {
    return calculator.calculate(this)
  }
}
```

### 2. 简化条件逻辑

#### 卫语句（Guard Clauses）

```typescript
// Before
function processOrder(order: Order): void {
  if (order !== null) {
    if (order.items.length > 0) {
      if (order.customer !== null) {
        // 处理逻辑
      }
    }
  }
}

// After
function processOrder(order: Order): void {
  if (order === null) return
  if (order.items.length === 0) return
  if (order.customer === null) return

  // 处理逻辑
}
```

### 3. 优化类结构

#### 分解大类

```typescript
// Before: 200+ 行的类
class Order {
  // 订单数据
  // 验证逻辑
  // 计算逻辑
  // 持久化逻辑
  // 通知逻辑
}

// After: 职责分离
class Order extends AggregateRoot {
  // 只保留核心业务逻辑
}

class OrderValidator {
  validate(order: Order): Result<void>
}

class OrderCalculator {
  calculateTotal(order: Order): Money
}

class OrderRepository {
  save(order: Order): Promise<void>
}
```

## 重构工具推荐

```bash
# VSCode 内置重构
- F2: 重命名
- Ctrl+Shift+R: 提取方法
- Ctrl+Shift+F: 查找所有引用

# CLI 工具
npx ts-prune              # 查找未使用的导出
npx madge --circular src  # 检测循环依赖
npx depcheck              # 检查未使用的依赖
```

## 注意事项

1. **红灯不重构**：测试必须全部通过才能开始
2. **保持行为**：不要在重构中添加新功能
3. **小步前进**：一次只做一个改动
4. **频繁测试**：每次改动后都运行测试
5. **提交节点**：在安全点提交代码
6. **性能意识**：注意重构对性能的影响
7. **可读性优先**：宁愿啰嗦也要清晰

## 参考资源

- Martin Fowler 《重构：改善既有代码的设计》
- [测试规范](.claude/rules/testing.md)
- [DDD 模式](.claude/rules/ddd-patterns.md)
- [代码风格](.claude/rules/code-style.md)
