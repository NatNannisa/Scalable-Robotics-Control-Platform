-- CP Hypermarket AI Robot Control Room
-- Demo seed for the current six-table UUID schema only.
-- This file intentionally does not modify or depend on the later advanced schema.
-- Required order:
--   1. Run supabase/current-schema.sql
--   2. Run this file

do $$
declare
  missing_tables text;
begin
  select string_agg(table_name, ', ' order by table_name)
  into missing_tables
  from (
    values
      ('public.zones'),
      ('public.campaigns'),
      ('public.robot_scripts'),
      ('public.robots'),
      ('public.event_logs'),
      ('public.customer_interactions')
  ) as required(table_name)
  where to_regclass(required.table_name) is null;

  if missing_tables is not null then
    raise exception
      'Missing required table(s): %. Run supabase/current-schema.sql first, then rerun supabase/seed-current-schema.sql.',
      missing_tables;
  end if;
end $$;

begin;

truncate table
  public.customer_interactions,
  public.event_logs,
  public.robot_scripts,
  public.robots,
  public.campaigns,
  public.zones
restart identity cascade;

-- 1. Zones
insert into public.zones (zone_name, traffic_level, created_at)
values
  ('Entrance', 'High', now() - interval '120 days'),
  ('Frozen Food', 'High', now() - interval '118 days'),
  ('Mini Corner', 'Medium', now() - interval '116 days'),
  ('Promotion Zone', 'High', now() - interval '114 days'),
  ('Beverage Zone', 'Medium', now() - interval '112 days'),
  ('Checkout', 'High', now() - interval '110 days'),
  ('Fresh Food', 'High', now() - interval '108 days'),
  ('Snacks & Beverages', 'Medium', now() - interval '106 days'),
  ('Household', 'Low', now() - interval '104 days'),
  ('Bakery', 'Medium', now() - interval '102 days');

-- 2. Campaigns
insert into public.campaigns (title, status, target_zone, created_at)
values
  ('Shrimpy Joy', 'Active', 'Frozen Food', now() - interval '45 days'),
  ('Mission to Space', 'Active', 'Promotion Zone', now() - interval '38 days'),
  ('CP Sampling Mini Corner', 'Active', 'Mini Corner', now() - interval '31 days'),
  ('Frozen Food Tasting', 'Ended', 'Frozen Food', now() - interval '75 days'),
  ('Weekend Sampling Push', 'Draft', 'Entrance', now() - interval '12 days'),
  ('Family Snack Promo', 'Draft', 'Snacks & Beverages', now() - interval '8 days');

-- 3. Robot scripts: three scripts per campaign
insert into public.robot_scripts (campaign_id, trigger_event, dialogue_th, dialogue_en)
select c.id, s.trigger_event, s.dialogue_th, s.dialogue_en
from public.campaigns c
join (
  values
    ('Shrimpy Joy', 'customer_detected',
      'สวัสดีค่ะ เชิญชิม Shrimpy Joy ได้เลยค่ะ กรอบอร่อย ชิมฟรีนะคะ',
      'Hello, please try our CP Shrimpy Joy sample today.'),
    ('Shrimpy Joy', 'sampling_interest',
      'ถ้าชอบรสชาตินี้ สามารถเลือกซื้อ Shrimpy Joy ได้ที่โซนอาหารแช่แข็งนะคะ',
      'You can find Shrimpy Joy in the Frozen Food zone.'),
    ('Shrimpy Joy', 'product_question',
      'สนใจสอบถามข้อมูลสินค้า CP เพิ่มเติมได้เลยนะคะ',
      'You can ask me about CP products anytime.'),

    ('Mission to Space', 'customer_approached',
      'พร้อมออกเดินทางหรือยังคะ มาร่วมภารกิจ Mission to Space และชิมสินค้าจาก CP กันค่ะ',
      'Ready for a mission? Please try our Mission to Space sample.'),
    ('Mission to Space', 'script_played',
      'ภารกิจวันนี้คือค้นหารสชาติที่คุณชอบ รับตัวอย่างทดลองได้เลยค่ะ',
      'Today''s mission is to discover your favorite CP flavor.'),
    ('Mission to Space', 'product_question',
      'สอบถามรายละเอียดสินค้าและโปรโมชั่น Mission to Space กับน้องชิมได้เลยค่ะ',
      'Ask me about Mission to Space products and promotions.'),

    ('CP Sampling Mini Corner', 'customer_detected',
      'แวะ Mini Corner สักครู่นะคะ วันนี้มีสินค้า CP ให้ทดลองชิมฟรีค่ะ',
      'Please visit our Mini Corner for a free CP sample today.'),
    ('CP Sampling Mini Corner', 'sampling_interest',
      'รับตัวอย่างได้เลยค่ะ หากถูกใจสามารถเลือกซื้อสินค้าบริเวณนี้ได้ทันทีนะคะ',
      'Please take a sample. The product is available in this area.'),
    ('CP Sampling Mini Corner', 'obstacle_detected',
      'ขอทางให้น้องชิมปฏิบัติงานหน่อยค่ะ ขอบคุณค่ะ',
      'Please allow me to continue my route. Thank you.'),

    ('Frozen Food Tasting', 'customer_approached',
      'สวัสดีค่ะ วันนี้มีเมนูจากโซนอาหารแช่แข็ง CP ให้ทดลองชิมนะคะ',
      'Hello, please try today''s CP Frozen Food sample.'),
    ('Frozen Food Tasting', 'sampling_interest',
      'เมนูนี้เตรียมง่ายและสะดวก เหมาะสำหรับมื้ออร่อยของครอบครัวค่ะ',
      'This product is convenient and easy to prepare for family meals.'),
    ('Frozen Food Tasting', 'product_question',
      'สามารถดูวิธีปรุงและข้อมูลโภชนาการได้จากบรรจุภัณฑ์นะคะ',
      'Preparation and nutrition details are available on the package.'),

    ('Weekend Sampling Push', 'customer_detected',
      'ยินดีต้อนรับค่ะ สุดสัปดาห์นี้มีตัวอย่างสินค้า CP และโปรโมชั่นพิเศษนะคะ',
      'Welcome. We have CP samples and special weekend promotions.'),
    ('Weekend Sampling Push', 'customer_approached',
      'แวะชิมก่อนเลือกซื้อได้นะคะ ใช้เวลาเพียงครู่เดียวค่ะ',
      'Please stop for a quick sample before you shop.'),
    ('Weekend Sampling Push', 'obstacle_detected',
      'ขออนุญาตผ่านเพื่อไปยังจุดแจกชิมถัดไปนะคะ',
      'Please allow me to continue to the next sampling point.'),

    ('Family Snack Promo', 'customer_detected',
      'มองหาขนมสำหรับครอบครัวอยู่หรือเปล่าคะ เชิญทดลองชิมสินค้า CP ได้เลยค่ะ',
      'Looking for a family snack? Please try our CP sample.'),
    ('Family Snack Promo', 'sampling_interest',
      'โปรโมชั่นสำหรับครอบครัวอยู่ที่โซน Snacks & Beverages นะคะ',
      'The family promotion is available in Snacks and Beverages.'),
    ('Family Snack Promo', 'product_question',
      'น้องชิมช่วยแนะนำสินค้าและโปรโมชั่นที่เหมาะกับครอบครัวได้นะคะ',
      'I can recommend CP products and promotions for your family.')
) as s(campaign_title, trigger_event, dialogue_th, dialogue_en)
  on c.title = s.campaign_title;

-- 4. Robots
insert into public.robots
  (name, status, battery_percentage, current_zone_id, last_updated)
select r.name, r.status, r.battery_percentage, z.id, r.last_updated
from (
  values
    ('CP-BOT-01 / Nong Chim 01', 'Patrolling', 78, 'Frozen Food', now() - interval '1 minute'),
    ('CP-BOT-02 / Nong Chim 02', 'Interacting', 64, 'Promotion Zone', now() - interval '2 minutes'),
    ('CP-BOT-03 / Nong Chim 03', 'Charging', 100, 'Checkout', now() - interval '3 minutes'),
    ('CP-BOT-04 / Nong Chim 04', 'Idle', 52, 'Mini Corner', now() - interval '7 minutes'),
    ('CP-BOT-05 / Nong Chim 05', 'Error', 28, 'Entrance', now() - interval '11 minutes')
) as r(name, status, battery_percentage, zone_name, last_updated)
join public.zones z on z.zone_name = r.zone_name;

-- 5. Event logs
insert into public.event_logs (robot_id, event_type, message, created_at)
select r.id, e.event_type, e.message, now() - make_interval(mins => e.minutes_ago)
from (
  values
    ('CP-BOT-01 / Nong Chim 01', 'Info', 'CP-BOT-01 started the morning patrol route.', 6),
    ('CP-BOT-01 / Nong Chim 01', 'Info', 'CP-BOT-01 entered Frozen Food zone.', 11),
    ('CP-BOT-01 / Nong Chim 01', 'Info', 'Customer detected at 1.4m in Frozen Food.', 16),
    ('CP-BOT-01 / Nong Chim 01', 'Info', 'Invitation script played for Shrimpy Joy.', 21),
    ('CP-BOT-01 / Nong Chim 01', 'Info', 'Sampling interest recorded after 18 seconds.', 26),
    ('CP-BOT-01 / Nong Chim 01', 'Warning', 'Temporary aisle congestion detected near Frozen Food.', 31),
    ('CP-BOT-01 / Nong Chim 01', 'Info', 'Robot resumed route after obstacle cleared.', 36),
    ('CP-BOT-01 / Nong Chim 01', 'Info', 'Route checkpoint completed successfully.', 41),

    ('CP-BOT-02 / Nong Chim 02', 'Info', 'CP-BOT-02 entered Promotion Zone.', 8),
    ('CP-BOT-02 / Nong Chim 02', 'Info', 'Customer group detected near Mission to Space display.', 13),
    ('CP-BOT-02 / Nong Chim 02', 'Info', 'Mission to Space invitation script played.', 18),
    ('CP-BOT-02 / Nong Chim 02', 'Info', 'Product question received from customer.', 23),
    ('CP-BOT-02 / Nong Chim 02', 'Info', 'Customer interaction completed after 52 seconds.', 28),
    ('CP-BOT-02 / Nong Chim 02', 'Warning', 'Robot speed reduced due to high customer traffic.', 33),
    ('CP-BOT-02 / Nong Chim 02', 'Info', 'Sampling conversion recorded in Promotion Zone.', 38),
    ('CP-BOT-02 / Nong Chim 02', 'Info', 'CP-BOT-02 resumed standard patrol speed.', 43),

    ('CP-BOT-03 / Nong Chim 03', 'Info', 'CP-BOT-03 returned to charging station.', 10),
    ('CP-BOT-03 / Nong Chim 03', 'Info', 'Charging cycle started at Checkout station.', 20),
    ('CP-BOT-03 / Nong Chim 03', 'Info', 'Battery reached 85 percent.', 40),
    ('CP-BOT-03 / Nong Chim 03', 'Info', 'Battery reached 100 percent.', 60),
    ('CP-BOT-03 / Nong Chim 03', 'Warning', 'Charging station occupied longer than planned.', 80),
    ('CP-BOT-03 / Nong Chim 03', 'Info', 'Diagnostics completed with no critical findings.', 100),

    ('CP-BOT-04 / Nong Chim 04', 'Info', 'CP-BOT-04 is idle at Mini Corner.', 12),
    ('CP-BOT-04 / Nong Chim 04', 'Info', 'Campaign content synchronized successfully.', 32),
    ('CP-BOT-04 / Nong Chim 04', 'Warning', 'No customer interaction detected for 20 minutes.', 52),
    ('CP-BOT-04 / Nong Chim 04', 'Info', 'Mini Corner route readiness check completed.', 72),
    ('CP-BOT-04 / Nong Chim 04', 'Info', 'Camera and microphone self-test passed.', 92),
    ('CP-BOT-04 / Nong Chim 04', 'Info', 'CP-BOT-04 awaiting next scheduled mission.', 112),

    ('CP-BOT-05 / Nong Chim 05', 'Alert', 'CP-BOT-05 entered Error status near Entrance.', 5),
    ('CP-BOT-05 / Nong Chim 05', 'Warning', 'Battery lower than 30 percent, recommend charging.', 9),
    ('CP-BOT-05 / Nong Chim 05', 'Alert', 'Obstacle sensor returned inconsistent distance readings.', 14),
    ('CP-BOT-05 / Nong Chim 05', 'Warning', 'Route paused pending operator review.', 19),
    ('CP-BOT-05 / Nong Chim 05', 'Info', 'Remote diagnostic session started.', 24),
    ('CP-BOT-05 / Nong Chim 05', 'Warning', 'Entrance route reassigned to CP-BOT-01.', 29),
    ('CP-BOT-05 / Nong Chim 05', 'Alert', 'Maintenance ticket created for obstacle sensor.', 34),
    ('CP-BOT-05 / Nong Chim 05', 'Info', 'Robot moved to a safe waiting position.', 39)
) as e(robot_name, event_type, message, minutes_ago)
join public.robots r on r.name = e.robot_name;

-- 6. Customer interactions
-- Generates 120 deterministic rows:
-- Passed By 48, Looked 30, Interacted 27, Converted 15.
with generated as (
  select
    n,
    case ((n - 1) % 10) + 1
      when 1 then 'CP-BOT-01 / Nong Chim 01'
      when 2 then 'CP-BOT-01 / Nong Chim 01'
      when 3 then 'CP-BOT-01 / Nong Chim 01'
      when 4 then 'CP-BOT-02 / Nong Chim 02'
      when 5 then 'CP-BOT-02 / Nong Chim 02'
      when 6 then 'CP-BOT-02 / Nong Chim 02'
      when 7 then 'CP-BOT-03 / Nong Chim 03'
      when 8 then 'CP-BOT-04 / Nong Chim 04'
      when 9 then 'CP-BOT-04 / Nong Chim 04'
      else 'CP-BOT-05 / Nong Chim 05'
    end as robot_name,
    case ((n - 1) % 16) + 1
      when 1 then 'Entrance'
      when 2 then 'Entrance'
      when 3 then 'Frozen Food'
      when 4 then 'Frozen Food'
      when 5 then 'Frozen Food'
      when 6 then 'Promotion Zone'
      when 7 then 'Promotion Zone'
      when 8 then 'Promotion Zone'
      when 9 then 'Checkout'
      when 10 then 'Checkout'
      when 11 then 'Mini Corner'
      when 12 then 'Beverage Zone'
      when 13 then 'Fresh Food'
      when 14 then 'Snacks & Beverages'
      when 15 then 'Bakery'
      else 'Household'
    end as zone_name,
    case
      when n % 17 = 0 then 'Child'
      when n % 11 = 0 then 'Senior'
      when n % 7 = 0 then 'Teen'
      else 'Adult'
    end as age_group,
    case
      when n % 10 in (0, 1) then 'Unknown'
      when n % 2 = 0 then 'Female'
      else 'Male'
    end as gender,
    case
      when n <= 48 then 'Passed By'
      when n <= 78 then 'Looked'
      when n <= 105 then 'Interacted'
      else 'Converted'
    end as engagement_stage,
    case
      when n <= 48 then n % 6
      when n <= 78 then 3 + (n % 13)
      when n <= 105 then 15 + (n % 46)
      else 45 + (n % 136)
    end as interaction_duration_sec,
    now()
      - make_interval(days => ((n - 1) % 14))
      - make_interval(hours => ((n * 3) % 12))
      - make_interval(mins => ((n * 7) % 60)) as created_at
  from generate_series(1, 120) as series(n)
)
insert into public.customer_interactions
  (robot_id, zone_id, age_group, gender, engagement_stage, interaction_duration_sec, created_at)
select
  r.id,
  z.id,
  g.age_group,
  g.gender,
  g.engagement_stage,
  g.interaction_duration_sec,
  g.created_at
from generated g
join public.robots r on r.name = g.robot_name
join public.zones z on z.zone_name = g.zone_name;

commit;

-- Seed summary
select 'zones' as table_name, count(*) as row_count from public.zones
union all
select 'campaigns', count(*) from public.campaigns
union all
select 'robot_scripts', count(*) from public.robot_scripts
union all
select 'robots', count(*) from public.robots
union all
select 'event_logs', count(*) from public.event_logs
union all
select 'customer_interactions', count(*) from public.customer_interactions
order by table_name;
