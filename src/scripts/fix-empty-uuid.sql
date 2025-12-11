-- 修复历史数据中event_id为空UUID的记录
-- 在 Supabase SQL Editor 中执行此脚本

-- 首先查看当前所有活动
SELECT id, name, created_at
FROM events
ORDER BY created_at DESC;

-- 查看有多少空UUID的记录
SELECT
  COUNT(*) as empty_uuid_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM attendees
WHERE event_id = '00000000-0000-0000-0000-000000000000';

-- 如果只有一个活动，将所有空UUID记录更新为该活动ID
-- 请将下面的 'YOUR_EVENT_ID' 替换为实际的活动ID

-- 步骤1: 先查看活动列表，确定要使用的event_id
-- 上面的第一个查询会显示所有活动，选择最新的活动ID

-- 步骤2: 执行更新（替换 'YOUR_EVENT_ID' 为实际的活动ID）
UPDATE attendees
SET event_id = 'YOUR_EVENT_ID',
    updated_at = NOW()
WHERE event_id = '00000000-0000-0000-0000-000000000000';

-- 验证更新结果
SELECT
  event_id,
  COUNT(*) as count
FROM attendees
GROUP BY event_id;

-- 确认没有空UUID记录了
SELECT COUNT(*) as remaining_empty_uuid
FROM attendees
WHERE event_id = '00000000-0000-0000-0000-000000000000';