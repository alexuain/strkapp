// --- RHYTHM DATA ---
const PATTERNS = {
    'slow_mo':      "1-------1-------",
    'cruising':     "1---1---1---1---",
    'turbo':        "1-1-1-1-1-1-1-1-",
    'hyper':        "1-11-111-11-1-1-",
    'double_tap':   "11------11------",
    'triplet_rush': "111-----111-----",
    'burst_fire':   "1111----1111----",
    'sync_beat':    "1--1--1--1--1---",
    'stamina_Test': "1-11-111-1111-11",
    'edge_hold':    "1---------------",
    'vibrate_mode': "1010101010101010",
    'chaos_hero':   "1-11--1---111-1-",
    'ruin_pattern': "1-1-1-1---------",
    'machine_gun':  "1111111111111111",
    'GHOST_TOUCH':  "1---------------",
    'BREATH_CONTROL': "1-------1-------",
    'TIP_TAPPING':  "1-1-1-----------",
    'SNAKE_COIL' :  "1---1---1-------",
    'FREEZE_TRAP' : "1!--------------",
    'METRONOME_LOCK': "1---1---1---1---",
    'DOUBLE_UMP':  "11------11------",
    'OFFBEAT_SWING': "1--1--1--1--1---",
    'DEEP_STROKE':  "1-------11111111",
    'ACCENT_BEAT':  "1---11--1---11--",
    'TRIPLET_GOD':  "111-111-111-111-",
    'STUTTER_GLITCH': "1-1-11-1-1-11-1-",
    'BURST_FIRE_V4': "1111----1111----",
    'RANDOM_ACCESS': "1-11--1---111-1-",
    'FIBONACCI_RAMP': "1-11-111-11111--",
    'MACHINE_GUN_MAX': "1111111111111111",
    'VIBRATION_MODE': "1010101010101010",
    'DENIAL_GATE':    "11111111--------",
    'DEATH_GRIP_INF': "11111111111111111111111111111111",
    'CHAOS_CLIMAX':   "111-11111-111111"
};

const scriptRaw = `
    slow_mo*2
    p2
    cruising*2
    p2
    turbo*2
    p2
    hyper*2
    p2
    double_tap*2
    p2
    triplet_rush*2
    p2
    burst_fire*2
    p2
    sync_beat*2
    p2
    stamina_test*2
    p2
    edge_hold*2
    p2
    vibrate_mode*2
    p2
    chaos_hero*2
    p2
    ruin_pattern*2
    p2
    machine_gun*2
    p2
    GHOST_TOUCH*2
    p2
    BREATH_CONTROL*2
    p2
    TIP_TAPPING*2
    p2
    SNAKE_COIL*2
    p2
    FREEZE_TRAP*2
    p2
    METRONOME_LOCK*2
    p2
    DOUBLE_PUMP*2
    p2
    OFFBEAT_SWING*2
    p2
    DEEP_STROKE*2
    p2
    ACCENT_BEAT*2
    p2
    TRIPLET_GOD*2
    p2
    STUTTER_GLITCH*2
    p2
    BURST_FIRE_V4*2
    p2
    RANDOM_ACCESS*2
    p2
    FIBONACCI_RAMP*2
    p2
    MACHINE_GUN_MAX*2
    p2
    VIBRATION_MODE*2
    p2
    DENIAL_GATE*2
    p2
    DEATH_GRIP_INF*2
    p2
    CHAOS_CLIMAX*2
    p2
    cum
`;