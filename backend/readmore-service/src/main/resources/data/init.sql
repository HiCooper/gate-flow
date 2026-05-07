CREATE DATABASE IF NOT EXISTS readmore_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE readmore_db;

CREATE TABLE IF NOT EXISTS book (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    cover_url VARCHAR(500),
    description TEXT,
    category VARCHAR(50),
    price INT DEFAULT 0,
    chapter_count INT DEFAULT 0,
    deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chapter (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    sort_order INT NOT NULL,
    deleted TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_reading_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_id BIGINT NOT NULL,
    read_progress INT DEFAULT 0,
    last_read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscription (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    plan_type VARCHAR(20) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO book (title, author, cover_url, description, category, price, chapter_count) VALUES
('三体', '刘慈欣', 'https://images.example.com/santi.jpg', '中国科幻文学的巅峰之作', '科幻', 2980, 5),
('活着', '余华', 'https://images.example.com/huozhe.jpg', '一个人一生的苦难与坚韧', '文学', 1980, 4),
('百年孤独', '马尔克斯', 'https://images.example.com/bainian.jpg', '魔幻现实主义代表作', '文学', 3500, 6),
('人类简史', '赫拉利', 'https://images.example.com/jianshi.jpg', '人类发展历程全景回顾', '历史', 3200, 5),
('深入理解Java虚拟机', '周志明', 'https://images.example.com/java.jpg', 'Java开发者必读经典', '技术', 4900, 8),
('小王子', '圣埃克苏佩里', 'https://images.example.com/wangzi.jpg', '写给成年人的童话', '童话', 980, 3),
('红楼梦', '曹雪芹', 'https://images.example.com/honglou.jpg', '中国古典小说巅峰之作', '古典', 5800, 10),
('时间简史', '霍金', 'https://images.example.com/time.jpg', '探索宇宙起源与未来', '科学', 2800, 4),
('围城', '钱锺书', 'https://images.example.com/weicheng.jpg', '对知识分子生活的讽刺', '文学', 2200, 5),
('设计模式', 'GoF', 'https://images.example.com/pattern.jpg', '软件设计模式开山之作', '技术', 4500, 7),
('月亮与六便士', '毛姆', 'https://images.example.com/moon.jpg', '追求艺术梦想的故事', '文学', 1800, 4),
('算法导论', 'Cormen等', 'https://images.example.com/algorithm.jpg', '计算机科学经典教材', '技术', 6800, 12);

INSERT INTO chapter (book_id, title, content, sort_order) VALUES
(1, '第一章 疯狂年代', '科学家叶文洁在红岸基地向宇宙发出了第一声呼唤...', 1),
(1, '第二章 三体游戏', '汪淼进入了神秘的三体游戏世界...', 2),
(1, '第三章 宇宙闪烁', '整个宇宙在智子的干扰下出现了诡异的现象...', 3),
(1, '第四章 面壁计划', '联合国启动了面壁计划以应对三体危机...', 4),
(1, '第五章 黑暗森林', '罗辑悟出了宇宙社会学的终极法则...', 5),
(2, '第一章 少年福贵', '我是一个名叫福贵的年轻人，家里富有...', 1),
(2, '第二章 家道中落', '一场赌局让福贵失去了所有家产...', 2),
(2, '第三章 战火纷飞', '福贵被国民党抓了壮丁...', 3),
(2, '第四章 苦难人生', '回到家乡后的福贵经历了更多的苦难...', 4),
(3, '第一章 马孔多的诞生', '何塞·阿尔卡蒂奥·布恩迪亚创建了马孔多...', 1),
(3, '第二章 失眠症', '马孔多的居民们染上了一种奇怪的失眠症...', 2),
(3, '第三章 内战', '奥雷连诺上校发动了三十二次武装起义...', 3),
(3, '第四章 香蕉公司', '美国香蕉公司的到来改变了马孔多...', 4),
(3, '第五章 百年风雨', '马孔多经历了繁荣与衰落...', 5),
(3, '第六章 命运的终结', '家族的最后一代被蚂蚁吃掉...', 6),
(4, '第一章 认知革命', '大约七万年前，智人开始了认知革命...', 1),
(4, '第二章 农业革命', '大约一万两千年前，人类开始了农业革命...', 2),
(4, '第三章 人类的融合统一', '金钱、帝国和宗教统一了人类...', 3),
(4, '第四章 科学革命', '五百年前，人类开始了科学革命...', 4),
(4, '第五章 未来的方向', '人类正在朝着神的方向迈进...', 5),
(5, '第一章 Java内存区域', 'Java虚拟机将内存划分为不同的区域...', 1),
(5, '第二章 垃圾回收', '垃圾回收是Java虚拟机最重要的特性之一...', 2),
(5, '第三章 类加载机制', '虚拟机把描述类的数据加载到内存...', 3),
(5, '第四章 字节码执行引擎', '字节码是Java跨平台的关键...', 4),
(5, '第五章 性能调优', '性能调优是Java开发者的必备技能...', 5),
(5, '第六章 并发编程', 'Java提供了丰富的并发编程工具...', 6),
(5, '第七章 编译优化', 'JIT编译器在运行时进行优化...', 7),
(5, '第八章 实战案例', '通过实际案例来理解虚拟机的行为...', 8);
