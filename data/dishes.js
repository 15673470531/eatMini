module.exports = {
  "version": 1,
  "updatedAt": "2026-09-19",
  "note": "冰箱配菜 - 菜品主数据（24 道样例，待人工校验）。仅 required 参与『缺少』判定；optional 为有更好；seasonings 仅展示不判定。pantry=true 的食材永不判缺。emoji 用于第一版无图卡片的视觉标识。",
  "dishes": [
    {
      "id": "dish_xihongshi_chaodan",
      "name": "西红柿炒鸡蛋",
      "emoji": "🍅",
      "required": [
        "xi_hong_shi",
        "ji_dan"
      ],
      "optional": [
        "xiao_cong"
      ],
      "seasonings": [
        "shi_yong_you",
        "yan",
        "bai_tang"
      ],
      "tags": [
        "快手",
        "家常",
        "素",
        "下饭"
      ],
      "timeMin": 10,
      "difficulty": 1,
      "steps": [
        "鸡蛋加少许盐打散",
        "热油把鸡蛋炒散，盛出备用",
        "下西红柿炒出汁，加一点糖",
        "回锅鸡蛋翻匀，撒葱花出锅"
      ]
    },
    {
      "id": "dish_fanqie_jidan_tang",
      "name": "番茄鸡蛋汤",
      "emoji": "🥣",
      "required": [
        "xi_hong_shi",
        "ji_dan"
      ],
      "optional": [
        "xiao_cong",
        "zi_cai"
      ],
      "seasonings": [
        "shi_yong_you",
        "yan"
      ],
      "tags": [
        "汤",
        "快手",
        "清淡"
      ],
      "timeMin": 10,
      "difficulty": 1,
      "steps": [
        "西红柿切块下锅炒软",
        "加水煮开",
        "淋入蛋液成蛋花",
        "调味撒葱花"
      ]
    },
    {
      "id": "dish_culiu_tudousi",
      "name": "醋溜土豆丝",
      "emoji": "🥔",
      "required": [
        "tu_dou"
      ],
      "optional": [
        "jian_jiao",
        "gan_la_jiao"
      ],
      "seasonings": [
        "shi_yong_you",
        "yan",
        "cu",
        "bai_tang",
        "hua_jiao"
      ],
      "tags": [
        "快手",
        "素",
        "下饭",
        "酸"
      ],
      "timeMin": 15,
      "difficulty": 1,
      "steps": [
        "土豆切细丝，泡水去淀粉",
        "热油爆花椒和干辣椒",
        "下土豆丝大火快炒",
        "沿锅边烹醋，加盐和少许糖出锅"
      ]
    },
    {
      "id": "dish_tudou_dun_niurou",
      "name": "土豆炖牛肉",
      "emoji": "🍲",
      "required": [
        "tu_dou",
        "niu_rou"
      ],
      "optional": [
        "hu_luo_bo",
        "yang_cong"
      ],
      "seasonings": [
        "liao_jiu",
        "sheng_chou",
        "lao_chou",
        "yan",
        "jiang",
        "da_cong",
        "wu_xiang_fen"
      ],
      "tags": [
        "炖菜",
        "硬菜",
        "荤"
      ],
      "timeMin": 90,
      "difficulty": 2,
      "steps": [
        "牛肉切块焯水去沫",
        "爆香葱姜，下牛肉翻炒",
        "加料酒生抽老抽，加热水没过",
        "小火炖 60 分钟",
        "下土豆和胡萝卜再炖 20 分钟收汁"
      ]
    },
    {
      "id": "dish_hongshao_rou",
      "name": "红烧肉",
      "emoji": "🥘",
      "required": [
        "wu_hua_rou"
      ],
      "optional": [],
      "seasonings": [
        "bai_tang",
        "lao_chou",
        "sheng_chou",
        "liao_jiu",
        "jiang",
        "da_cong"
      ],
      "tags": [
        "硬菜",
        "荤",
        "下饭"
      ],
      "timeMin": 90,
      "difficulty": 3,
      "steps": [
        "五花肉切方块，冷水下锅焯水",
        "小火炒糖色至枣红",
        "下肉块裹匀糖色",
        "加料酒生抽老抽和热水",
        "小火焖 60 分钟，大火收汁"
      ]
    },
    {
      "id": "dish_qingjiao_rousi",
      "name": "青椒肉丝",
      "emoji": "🌶️",
      "required": [
        "qing_jiao",
        "li_ji_rou"
      ],
      "optional": [
        "mu_er",
        "gan_la_jiao"
      ],
      "seasonings": [
        "sheng_chou",
        "dian_fen",
        "yan",
        "shi_yong_you",
        "suan"
      ],
      "tags": [
        "快手",
        "荤",
        "下饭"
      ],
      "timeMin": 15,
      "difficulty": 2,
      "steps": [
        "里脊切丝，加生抽淀粉抓匀腌 10 分钟",
        "青椒切丝",
        "热油滑散肉丝盛出",
        "炒青椒断生，回锅肉丝调味"
      ]
    },
    {
      "id": "dish_suanrong_shengcai",
      "name": "蒜蓉生菜",
      "emoji": "🥬",
      "required": [
        "sheng_cai"
      ],
      "optional": [],
      "seasonings": [
        "suan",
        "shi_yong_you",
        "yan",
        "hao_you"
      ],
      "tags": [
        "快手",
        "素",
        "清淡"
      ],
      "timeMin": 8,
      "difficulty": 1,
      "steps": [
        "蒜切末",
        "热油爆香蒜末",
        "下生菜大火快炒",
        "加盐和蚝油，断生即出锅"
      ]
    },
    {
      "id": "dish_mapo_doufu",
      "name": "麻婆豆腐",
      "emoji": "🥢",
      "required": [
        "dou_fu",
        "rou_mo"
      ],
      "optional": [
        "xiao_cong",
        "hua_jiao"
      ],
      "seasonings": [
        "dou_ban_jiang",
        "sheng_chou",
        "dian_fen",
        "shi_yong_you",
        "la_jiao_mian",
        "hua_jiao"
      ],
      "tags": [
        "川菜",
        "荤",
        "下饭",
        "辣"
      ],
      "timeMin": 20,
      "difficulty": 2,
      "steps": [
        "豆腐切块，盐水浸泡去豆腥",
        "炒香肉末和豆瓣酱",
        "加水煮开下豆腐",
        "小火煮 5 分钟，勾芡",
        "撒花椒粉和葱花"
      ]
    },
    {
      "id": "dish_xianggu_qingcai",
      "name": "香菇青菜",
      "emoji": "🍄",
      "required": [
        "xiang_gu",
        "xiao_bai_cai"
      ],
      "optional": [],
      "seasonings": [
        "suan",
        "shi_yong_you",
        "yan",
        "hao_you"
      ],
      "tags": [
        "素",
        "清淡",
        "快手"
      ],
      "timeMin": 12,
      "difficulty": 1,
      "steps": [
        "香菇切片，青菜洗净",
        "香菇先下锅炒出香",
        "下青菜大火快炒",
        "加盐蚝油调味"
      ]
    },
    {
      "id": "dish_ganbian_doujiao",
      "name": "干煸豆角",
      "emoji": "🫘",
      "required": [
        "dou_jiao",
        "rou_mo"
      ],
      "optional": [
        "gan_la_jiao",
        "ya_cai"
      ],
      "seasonings": [
        "shi_yong_you",
        "yan",
        "sheng_chou",
        "suan"
      ],
      "tags": [
        "家常",
        "荤",
        "下饭"
      ],
      "timeMin": 20,
      "difficulty": 2,
      "steps": [
        "豆角掐段，干锅煸至起皱盛出",
        "炒香肉末和干辣椒",
        "回锅豆角翻炒",
        "加盐生抽炒匀"
      ]
    },
    {
      "id": "dish_hongshao_qiezi",
      "name": "红烧茄子",
      "emoji": "🍆",
      "required": [
        "qie_zi"
      ],
      "optional": [
        "qing_jiao"
      ],
      "seasonings": [
        "suan",
        "sheng_chou",
        "lao_chou",
        "bai_tang",
        "dian_fen",
        "shi_yong_you"
      ],
      "tags": [
        "家常",
        "素",
        "下饭"
      ],
      "timeMin": 20,
      "difficulty": 2,
      "steps": [
        "茄子滚刀块，撒盐静置挤水",
        "下油锅煎至微焦盛出",
        "爆香蒜末，下调汁烧开",
        "回锅茄子焖 3 分钟收汁"
      ]
    },
    {
      "id": "dish_liangban_huanggua",
      "name": "凉拌黄瓜",
      "emoji": "🥒",
      "required": [
        "huang_gua"
      ],
      "optional": [
        "xiang_cai"
      ],
      "seasonings": [
        "suan",
        "cu",
        "sheng_chou",
        "xiang_you",
        "yan",
        "bai_tang",
        "la_jiao_mian"
      ],
      "tags": [
        "凉菜",
        "快手",
        "清淡",
        "素"
      ],
      "timeMin": 5,
      "difficulty": 1,
      "steps": [
        "黄瓜拍碎切段",
        "加盐腌 5 分钟倒掉水",
        "蒜末、醋、生抽、糖、香油拌匀",
        "撒辣椒面和香菜"
      ]
    },
    {
      "id": "dish_zicai_danhua_tang",
      "name": "紫菜蛋花汤",
      "emoji": "🍜",
      "required": [
        "ji_dan"
      ],
      "optional": [
        "xia_pi",
        "xiang_cai"
      ],
      "seasonings": [
        "yan",
        "xiang_you",
        "shi_yong_you"
      ],
      "tags": [
        "汤",
        "快手",
        "清淡",
        "兜底"
      ],
      "timeMin": 5,
      "difficulty": 1,
      "steps": [
        "水开下撕碎的紫菜和虾皮",
        "淋蛋液，成蛋花即关火",
        "加盐和香油，撒香菜"
      ]
    },
    {
      "id": "dish_muer_chaodan",
      "name": "木耳炒鸡蛋",
      "emoji": "🥚",
      "required": [
        "ji_dan"
      ],
      "optional": [
        "mu_er",
        "xiao_cong"
      ],
      "seasonings": [
        "yan",
        "sheng_chou",
        "shi_yong_you"
      ],
      "tags": [
        "家常",
        "素",
        "快手"
      ],
      "timeMin": 12,
      "difficulty": 1,
      "steps": [
        "木耳泡发撕小朵",
        "鸡蛋炒散盛出",
        "下木耳快炒",
        "回锅鸡蛋，调味出锅"
      ]
    },
    {
      "id": "dish_kele_jichi",
      "name": "可乐鸡翅",
      "emoji": "🍗",
      "required": [
        "ji_chi",
        "ke_le"
      ],
      "optional": [],
      "seasonings": [
        "sheng_chou",
        "lao_chou",
        "liao_jiu",
        "jiang"
      ],
      "tags": [
        "硬菜",
        "荤",
        "甜"
      ],
      "timeMin": 25,
      "difficulty": 2,
      "steps": [
        "鸡翅两面划刀，焯水",
        "煎至两面金黄",
        "加料酒生抽老抽和可乐没过",
        "中火收汁至浓稠"
      ]
    },
    {
      "id": "dish_huangmen_ji",
      "name": "黄焖鸡",
      "emoji": "🍛",
      "required": [
        "ji_tui",
        "xiang_gu"
      ],
      "optional": [
        "qing_jiao",
        "tu_dou"
      ],
      "seasonings": [
        "sheng_chou",
        "lao_chou",
        "liao_jiu",
        "bai_tang",
        "jiang",
        "suan"
      ],
      "tags": [
        "家常",
        "荤",
        "下饭"
      ],
      "timeMin": 40,
      "difficulty": 2,
      "steps": [
        "鸡腿剁块焯水",
        "炒香姜蒜下鸡块煸炒",
        "加调料和热水，下香菇",
        "焖 20 分钟，下青椒收汁"
      ]
    },
    {
      "id": "dish_xihongshi_niurou_mian",
      "name": "西红柿牛肉面",
      "emoji": "🍝",
      "required": [
        "xi_hong_shi",
        "niu_rou",
        "mian_tiao"
      ],
      "optional": [
        "xiao_cong",
        "xiang_cai"
      ],
      "seasonings": [
        "yan",
        "sheng_chou",
        "liao_jiu",
        "jiang",
        "shi_yong_you"
      ],
      "tags": [
        "主食",
        "汤",
        "荤"
      ],
      "timeMin": 30,
      "difficulty": 2,
      "steps": [
        "牛肉切片腌制",
        "西红柿炒出汁加水煮开",
        "下牛肉煮熟调味",
        "另锅煮面，浇上汤头"
      ]
    },
    {
      "id": "dish_dan_chaofan",
      "name": "蛋炒饭",
      "emoji": "🍚",
      "required": [
        "mi_fan",
        "ji_dan"
      ],
      "optional": [
        "hu_luo_bo",
        "xiao_cong",
        "huo_tui_chang",
        "yu_mi"
      ],
      "seasonings": [
        "yan",
        "sheng_chou",
        "shi_yong_you"
      ],
      "tags": [
        "主食",
        "快手",
        "下饭"
      ],
      "timeMin": 10,
      "difficulty": 1,
      "steps": [
        "鸡蛋打散炒散",
        "下米饭大火炒散粒",
        "加配菜丁翻炒",
        "加盐生抽调味，撒葱花"
      ]
    },
    {
      "id": "dish_qingchao_xilanhua",
      "name": "清炒西兰花",
      "emoji": "🥦",
      "required": [
        "xi_lan_hua"
      ],
      "optional": [
        "hu_luo_bo"
      ],
      "seasonings": [
        "suan",
        "yan",
        "hao_you",
        "shi_yong_you"
      ],
      "tags": [
        "素",
        "清淡",
        "快手"
      ],
      "timeMin": 10,
      "difficulty": 1,
      "steps": [
        "西兰花掰小朵，盐水焯 1 分钟",
        "热油爆蒜末",
        "下西兰花快炒",
        "加盐蚝油出锅"
      ]
    },
    {
      "id": "dish_paigu_yumi_tang",
      "name": "排骨玉米汤",
      "emoji": "🌽",
      "required": [
        "pai_gu",
        "yu_mi"
      ],
      "optional": [
        "hu_luo_bo",
        "jiang"
      ],
      "seasonings": [
        "yan",
        "liao_jiu",
        "jiang"
      ],
      "tags": [
        "汤",
        "清淡",
        "荤"
      ],
      "timeMin": 60,
      "difficulty": 1,
      "steps": [
        "排骨焯水去沫",
        "加姜片料酒和热水煮开",
        "下玉米段炖 40 分钟",
        "加盐调味"
      ]
    },
    {
      "id": "dish_zhurou_baicai_fentiao",
      "name": "猪肉白菜炖粉条",
      "emoji": "🍜",
      "required": [
        "zhu_rou",
        "da_bai_cai",
        "fen_si"
      ],
      "optional": [],
      "seasonings": [
        "sheng_chou",
        "lao_chou",
        "liao_jiu",
        "jiang",
        "da_cong"
      ],
      "tags": [
        "炖菜",
        "荤",
        "下饭",
        "东北"
      ],
      "timeMin": 40,
      "difficulty": 2,
      "steps": [
        "五花肉或后腿肉切片煸出油",
        "下白菜帮子炒软",
        "加水、泡软的粉条和调味",
        "炖 15 分钟至粉条透明"
      ]
    },
    {
      "id": "dish_yangcong_chaodan",
      "name": "洋葱炒鸡蛋",
      "emoji": "🧅",
      "required": [
        "yang_cong",
        "ji_dan"
      ],
      "optional": [],
      "seasonings": [
        "yan",
        "sheng_chou",
        "shi_yong_you"
      ],
      "tags": [
        "快手",
        "素",
        "家常"
      ],
      "timeMin": 12,
      "difficulty": 1,
      "steps": [
        "洋葱切丝",
        "鸡蛋炒散盛出",
        "下洋葱炒至微透",
        "回锅鸡蛋调味"
      ]
    },
    {
      "id": "dish_zheng_dangeng",
      "name": "蒸蛋羹",
      "emoji": "🥚",
      "required": [
        "ji_dan"
      ],
      "optional": [
        "xia_pi",
        "xiao_cong"
      ],
      "seasonings": [
        "yan",
        "xiang_you",
        "sheng_chou"
      ],
      "tags": [
        "兜底",
        "快手",
        "清淡",
        "宝宝"
      ],
      "timeMin": 15,
      "difficulty": 1,
      "steps": [
        "蛋液加 1.5 倍温水和盐打匀",
        "过筛去掉气泡",
        "盖保鲜膜扎孔，中火蒸 10 分钟",
        "淋生抽香油，撒葱花"
      ]
    },
    {
      "id": "dish_suanxiang_xiaren",
      "name": "蒜蓉虾仁",
      "emoji": "🦐",
      "required": [
        "xia"
      ],
      "optional": [
        "xiao_cong"
      ],
      "seasonings": [
        "suan",
        "yan",
        "liao_jiu",
        "shi_yong_you",
        "bai_hu_jiao"
      ],
      "tags": [
        "快手",
        "荤",
        "清淡"
      ],
      "timeMin": 15,
      "difficulty": 2,
      "steps": [
        "虾去线，加料酒胡椒腌 10 分钟",
        "热油爆香蒜末",
        "下虾仁大火快炒至变色",
        "加盐调味，撒葱花"
      ]
    },
    {
      "id": "dish_paigu_dun_donggua",
      "name": "冬瓜排骨汤",
      "emoji": "🍲",
      "required": [
        "pai_gu",
        "dong_gua"
      ],
      "optional": [
        "jiang",
        "gou_qi"
      ],
      "seasonings": [
        "yan",
        "liao_jiu",
        "jiang"
      ],
      "tags": [
        "汤",
        "清淡",
        "荤",
        "夏季"
      ],
      "timeMin": 60,
      "difficulty": 1,
      "steps": [
        "排骨焯水",
        "加姜片料酒炖 30 分钟",
        "下冬瓜块再炖 20 分钟",
        "加盐调味"
      ]
    },
    {
      "id": "dish_fanqie_dun_doufu",
      "name": "番茄豆腐煲",
      "emoji": "🍲",
      "required": [
        "xi_hong_shi",
        "dou_fu"
      ],
      "optional": [
        "jin_zhen_gu",
        "xiao_cong"
      ],
      "seasonings": [
        "yan",
        "fan_qie_jiang",
        "shi_yong_you",
        "bai_tang"
      ],
      "tags": [
        "家常",
        "素",
        "下饭"
      ],
      "timeMin": 20,
      "difficulty": 1,
      "steps": [
        "西红柿炒出汁，加番茄酱",
        "下豆腐块和少量水",
        "小火焖 5 分钟",
        "加盐调味，撒葱花"
      ]
    },
    {
      "id": "dish_qingjiao_chaodan",
      "name": "青椒炒鸡蛋",
      "emoji": "🫑",
      "required": [
        "qing_jiao",
        "ji_dan"
      ],
      "optional": [
        "xiao_cong"
      ],
      "seasonings": [
        "shi_yong_you",
        "yan"
      ],
      "tags": [
        "快手",
        "家常",
        "下饭"
      ],
      "timeMin": 12,
      "difficulty": 1,
      "steps": [
        "青椒洗净去籽切丝，鸡蛋打散。",
        "鸡蛋炒熟盛出。",
        "青椒炒熟，回锅鸡蛋。",
        "加盐翻匀出锅。"
      ]
    }
  ]
}
