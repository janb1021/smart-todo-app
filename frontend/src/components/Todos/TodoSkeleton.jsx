// 待办卡片骨架屏
export function TodoCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        {/* 勾选框占位 */}
        <div className="mt-0.5 w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />

        {/* 内容区域 */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* 标题占位 */}
          <div className="h-5 bg-gray-200 rounded w-3/4" />

          {/* 描述占位 */}
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />

          {/* 标签占位 */}
          <div className="flex gap-2 pt-1">
            <div className="h-5 bg-gray-200 rounded-full w-16" />
            <div className="h-5 bg-gray-200 rounded-full w-20" />
          </div>
        </div>

        {/* 操作按钮占位 */}
        <div className="flex gap-1">
          <div className="w-7 h-7 rounded-lg bg-gray-200" />
          <div className="w-7 h-7 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// 统计卡片骨架屏
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-8 bg-gray-200 rounded w-12" />
    </div>
  );
}

// 完整列表加载骨架屏
export default function TodoListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <TodoCardSkeleton key={index} />
      ))}
    </div>
  );
}
