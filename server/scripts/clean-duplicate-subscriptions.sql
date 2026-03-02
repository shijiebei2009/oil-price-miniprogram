-- ========================================
-- 清理重复订阅记录脚本
-- 保留每个用户在同一城市同一场景的最新订阅
-- ========================================

-- 查看当前的重复订阅情况
SELECT 
  openid,
  scene,
  province,
  city,
  COUNT(*) as duplicate_count,
  MIN(created_at) as oldest_created_at,
  MAX(created_at) as newest_created_at
FROM subscription_messages
GROUP BY openid, scene, province, city
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 删除重复的订阅记录，保留最新的
DELETE FROM subscription_messages
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY openid, scene, province, city 
        ORDER BY created_at DESC
      ) AS row_num
    FROM subscription_messages
  ) AS duplicates
  WHERE row_num > 1
);

-- 验证清理结果（应该返回0，说明没有重复了）
SELECT 
  openid,
  scene,
  province,
  city,
  COUNT(*) as count
FROM subscription_messages
GROUP BY openid, scene, province, city
HAVING COUNT(*) > 1;

-- 查看清理后的总记录数
SELECT COUNT(*) as total_subscriptions FROM subscription_messages;

-- 查看所有剩余的订阅记录
SELECT 
  id,
  openid,
  scene,
  province,
  city,
  created_at,
  expires_at
FROM subscription_messages
ORDER BY created_at DESC
LIMIT 20;
