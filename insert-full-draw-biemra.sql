-- Full knockout draw for biemra: R16 → QF → SF → Final
UPDATE settings
SET knockout_draw = '{
  "published": false,
  "slots": [
    {"id":"r16-1","round":"R16","order":0,"home":{"type":"seed","group":"A","pos":1},"away":{"type":"seed","group":"C","pos":2}},
    {"id":"r16-2","round":"R16","order":1,"home":{"type":"seed","group":"C","pos":1},"away":{"type":"seed","group":"A","pos":2}},
    {"id":"r16-3","round":"R16","order":2,"home":{"type":"seed","group":"B","pos":1},"away":{"type":"seed","group":"D","pos":2}},
    {"id":"r16-4","round":"R16","order":3,"home":{"type":"seed","group":"D","pos":1},"away":{"type":"seed","group":"B","pos":2}},
    {"id":"r16-5","round":"R16","order":4,"home":{"type":"seed","group":"E","pos":1},"away":{"type":"seed","group":"G","pos":2}},
    {"id":"r16-6","round":"R16","order":5,"home":{"type":"seed","group":"G","pos":1},"away":{"type":"seed","group":"E","pos":2}},
    {"id":"r16-7","round":"R16","order":6,"home":{"type":"seed","group":"F","pos":1},"away":{"type":"seed","group":"H","pos":2}},
    {"id":"r16-8","round":"R16","order":7,"home":{"type":"seed","group":"H","pos":1},"away":{"type":"seed","group":"F","pos":2}},
    {"id":"qf-1","round":"QF","order":0,"home":{"type":"winner","of":"r16-1"},"away":{"type":"winner","of":"r16-3"}},
    {"id":"qf-2","round":"QF","order":1,"home":{"type":"winner","of":"r16-2"},"away":{"type":"winner","of":"r16-4"}},
    {"id":"qf-3","round":"QF","order":2,"home":{"type":"winner","of":"r16-5"},"away":{"type":"winner","of":"r16-7"}},
    {"id":"qf-4","round":"QF","order":3,"home":{"type":"winner","of":"r16-6"},"away":{"type":"winner","of":"r16-8"}},
    {"id":"sf-1","round":"SF","order":0,"home":{"type":"winner","of":"qf-1"},"away":{"type":"winner","of":"qf-2"}},
    {"id":"sf-2","round":"SF","order":1,"home":{"type":"winner","of":"qf-3"},"away":{"type":"winner","of":"qf-4"}},
    {"id":"final-1","round":"FINAL","order":0,"home":{"type":"winner","of":"sf-1"},"away":{"type":"winner","of":"sf-2"}}
  ]
}'::jsonb
WHERE league_id = '959cf36f-4aa9-4687-9ddf-0b72c2f75fc3';
