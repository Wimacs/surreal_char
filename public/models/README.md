# VRM 模型文件目录

请将您的 VRM 模型文件（.vrm）放在此目录下。

## 使用方法

在代码中加载 VRM 文件时，使用以下路径格式：

### 开发环境
```typescript
loadVRM('/models/your-model.vrm')
```

### 生产环境
```typescript
loadVRM('./models/your-model.vrm')
```

## 示例

假设您有一个名为 `character.vrm` 的文件放在此目录，可以这样加载：

```typescript
import { loadVRM } from './renderer';

// 开发环境
await loadVRM('/models/character.vrm');

// 或者使用相对路径（生产环境）
await loadVRM('./models/character.vrm');
```

## 注意事项

- VRM 文件通常较大，建议使用压缩格式
- 确保 VRM 文件符合 VRM 0.x 或 1.0 规范
- 文件路径区分大小写



