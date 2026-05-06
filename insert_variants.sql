USE victor_experiment;
DELETE FROM victor_variant WHERE exp_id = 1;
INSERT INTO victor_variant (exp_id, variant_key, name, bucket_start, bucket_end, params, created_at) VALUES 
(1, 'control', '对照组', 0, 49, '{}', NOW()),
(1, 'treatment', '实验组(蓝色按钮)', 50, 100, '{"button_color": "blue"}', NOW());
SELECT variant_key, name, bucket_start, bucket_end FROM victor_variant WHERE exp_id = 1;
