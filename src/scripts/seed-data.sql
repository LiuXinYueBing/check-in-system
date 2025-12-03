-- 示例数据脚本
-- 在 Supabase SQL Editor 中执行此脚本来创建测试数据

-- 创建示例活动
INSERT INTO events (id, name, date, location, description) VALUES
('00000000-0000-0000-0000-000000000000', '年度技术大会', '2024-12-25', '北京国际会议中心', '2024年度技术交流大会')
ON CONFLICT (id) DO NOTHING;

-- 创建示例参会者数据
INSERT INTO attendees (id, event_id, name, phone, status, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', '张三', '13800138001', 'registered', NOW()),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', '李四', '13800138002', 'checked_in', NOW() - INTERVAL '1 hour'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', '王五', '13800138003', 'checked_in', NOW() - INTERVAL '2 hour'),
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', '赵六', '13800138004', 'redeemed', NOW() - INTERVAL '3 hour'),
('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', '钱七', '13800138005', 'registered', NOW())
ON CONFLICT (id) DO NOTHING;

-- 更新已入场和已核销的时间
UPDATE attendees SET
  check_in_time = NOW() - INTERVAL '1 hour'
WHERE id = '22222222-2222-2222-2222-222222222222' OR id = '33333333-3333-3333-3333-333333333333';

UPDATE attendees SET
  check_in_time = NOW() - INTERVAL '3 hour',
  redeem_time = NOW() - INTERVAL '2.5 hour'
WHERE id = '44444444-4444-4444-4444-444444444444';

-- 验证数据
SELECT
  COUNT(*) as total_attendees,
  COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered,
  COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as checked_in,
  COUNT(CASE WHEN status = 'redeemed' THEN 1 END) as redeemed
FROM attendees
WHERE event_id = '00000000-0000-0000-0000-000000000000';