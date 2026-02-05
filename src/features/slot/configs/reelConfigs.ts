import { SegmentReelConfig } from '../types'
import { SLOT_THEMES } from './themes'

// ============================================
// SKILLS SEGMENT - Audio/Technical Skills
// ============================================
const SKILLS_CONFIG: SegmentReelConfig = {
  title: 'SKILLS',
  subtitle: 'Audio Expertise',
  reels: [
    // Reel 1: Skill Category
    [
      { icon: '🎼', label: 'Game Audio', color: '#00ffff' },
      { icon: '🎚️', label: 'Sound Design', color: '#ff00aa' },
      { icon: '🎹', label: 'Music Composition', color: '#8844ff' },
      { icon: '⚙️', label: 'Implementation', color: '#00ff88' },
      { icon: '🎙️', label: 'Recording', color: '#ffd700' }
    ],
    // Reel 2: Specific Skill
    [
      { icon: '🔄', label: 'Adaptive Music', color: '#00ffff' },
      { icon: '🎯', label: 'Interactive SFX', color: '#ff00aa' },
      { icon: '📊', label: 'Mix Balancing', color: '#8844ff' },
      { icon: '📝', label: 'JSON Logic', color: '#00ff88' },
      { icon: '🎤', label: 'Foley', color: '#ffd700' }
    ],
    // Reel 3: Level
    [
      { icon: '⭐⭐⭐⭐⭐', label: 'Expert', color: '#ffd700' },
      { icon: '⭐⭐⭐⭐', label: 'Advanced', color: '#00ff88' },
      { icon: '⭐⭐⭐', label: 'Proficient', color: '#00ffff' }
    ],
    // Reel 4: Years
    [
      { icon: '🔟', label: '10+ godina', color: '#ffd700' },
      { icon: '5️⃣', label: '5+ godina', color: '#00ff88' },
      { icon: '3️⃣', label: '3+ godina', color: '#00ffff' }
    ],
    // Reel 5: Context
    [
      { icon: '🎰', label: 'Slot Games', color: '#ffd700' },
      { icon: '🎮', label: 'Game Dev', color: '#00ffff' },
      { icon: '🎬', label: 'Trailers', color: '#ff00aa' },
      { icon: '📱', label: 'Mobile', color: '#00ff88' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "Game Audio Design sa adaptivnom muzikom na Expert nivou. 10+ godina iskustva u slot igrama.", highlight: "Layered Music Systems" },
    { indices: [1, 1, 1, 1, 1], story: "Sound Design sa Interactive SFX, Advanced nivo. 5+ godina rada na game development projektima.", highlight: "Performance-Based SFX" },
    { indices: [2, 2, 2, 2, 2], story: "Music Composition sa Mix Balancing ekspertizom. Proficient u trailer produkciji.", highlight: "Cinematic Scores" }
  ],
  generateStory: (indices, reels) => {
    const cat = reels[0][indices[0] % reels[0].length]
    const skill = reels[1][indices[1] % reels[1].length]
    const level = reels[2][indices[2] % reels[2].length]
    const years = reels[3][indices[3] % reels[3].length]
    const ctx = reels[4][indices[4] % reels[4].length]
    return `${cat.label}: ${skill.label} na ${level.label} nivou. ${years.label} iskustva u ${ctx.label} produkciji.`
  }
}

// ============================================
// EXPERIENCE SEGMENT - Work History
// ============================================
const EXPERIENCE_CONFIG: SegmentReelConfig = {
  title: 'EXPERIENCE',
  subtitle: 'Work History',
  reels: [
    // Reel 1: Company
    [
      { icon: '🎨', label: 'VanVinkl Studio', color: '#00ffff', info: 'May 2024 - Present' },
      { icon: '🏢', label: 'IGT', color: '#ff00aa', info: 'Sep 2020 - May 2024' },
      { icon: '🎵', label: 'Studio Strip', color: '#8844ff', info: 'Apr 2020 - Dec 2022' }
    ],
    // Reel 2: Role
    [
      { icon: '🎛️', label: 'Audio Producer', color: '#00ffff' },
      { icon: '🎼', label: 'Lead Sound Designer', color: '#ff00aa' },
      { icon: '🔊', label: 'Composer', color: '#8844ff' }
    ],
    // Reel 3: Responsibility
    [
      { icon: '🌍', label: 'International Clients', color: '#ffd700' },
      { icon: '👥', label: 'Team of 2', color: '#00ff88' },
      { icon: '🎯', label: 'Full Pipeline', color: '#00ffff' }
    ],
    // Reel 4: Achievement
    [
      { icon: '📦', label: 'Complete Packages', color: '#ffd700' },
      { icon: '🎰', label: '50+ Slot Games', color: '#ff00aa' },
      { icon: '✅', label: 'QA Testing', color: '#00ff88' }
    ],
    // Reel 5: Market
    [
      { icon: '🇪🇺', label: 'European', color: '#00ffff' },
      { icon: '🌍', label: 'Global', color: '#ffd700' },
      { icon: '🎮', label: 'Gaming', color: '#00ff88' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "VanVinkl Studio (2024-Present): Audio Producer za međunarodne klijente. Vodim kompletnu audio produkciju - od koncepta do masteringa.", highlight: "Founder & Audio Producer" },
    { indices: [1, 1, 1, 1, 1], story: "IGT (2020-2024): Lead Sound Designer. Vodio tim od 2 audio dizajnera, kreirao 50+ slot soundtracks za evropsko i globalno tržište.", highlight: "4 godine • 50+ slot games" },
    { indices: [2, 2, 2, 2, 2], story: "Studio Strip (2020-2022): Asistencija u muzičkoj produkciji, event koordinacija i korporativni eventi.", highlight: "Studio Production" }
  ],
  generateStory: (indices, reels) => {
    const company = reels[0][indices[0] % reels[0].length]
    const role = reels[1][indices[1] % reels[1].length]
    const resp = reels[2][indices[2] % reels[2].length]
    const achieve = reels[3][indices[3] % reels[3].length]
    const market = reels[4][indices[4] % reels[4].length]
    return `${company.label}: ${role.label}. ${resp.label}. Dostignuće: ${achieve.label}. Tržište: ${market.label}.`
  }
}

// ============================================
// SERVICES SEGMENT - What I Offer
// ============================================
const SERVICES_CONFIG: SegmentReelConfig = {
  title: 'SERVICES',
  subtitle: 'Audio Services',
  reels: [
    // Reel 1: Service Type
    [
      { icon: '🎵', label: 'Music Production', color: '#ff00aa' },
      { icon: '🔊', label: 'Sound Design', color: '#00ffff' },
      { icon: '🎚️', label: 'Audio Mastering', color: '#8844ff' },
      { icon: '⚙️', label: 'Implementation', color: '#00ff88' }
    ],
    // Reel 2: Platform
    [
      { icon: '🎰', label: 'Slot Games', color: '#ffd700' },
      { icon: '📱', label: 'Mobile Games', color: '#00ffff' },
      { icon: '🎬', label: 'Trailers', color: '#ff00aa' },
      { icon: '🎮', label: 'Video Games', color: '#00ff88' }
    ],
    // Reel 3: Deliverable
    [
      { icon: '📦', label: 'Full Package', color: '#ffd700' },
      { icon: '🎼', label: 'Original Score', color: '#ff00aa' },
      { icon: '💥', label: 'SFX Library', color: '#00ffff' },
      { icon: '🔧', label: 'Integration', color: '#00ff88' }
    ],
    // Reel 4: Quality
    [
      { icon: '⭐', label: 'AAA Quality', color: '#ffd700' },
      { icon: '🏆', label: 'Industry Standard', color: '#00ff88' },
      { icon: '✨', label: 'Premium', color: '#8844ff' }
    ],
    // Reel 5: Turnaround
    [
      { icon: '⚡', label: 'Fast Delivery', color: '#ffd700' },
      { icon: '🤝', label: 'Collaborative', color: '#00ffff' },
      { icon: '🔄', label: 'Iterative', color: '#00ff88' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "Music Production za Slot Games: Full audio package sa AAA kvalitetom i brzom isporukom.", highlight: "Complete Slot Audio" },
    { indices: [1, 1, 1, 1, 1], story: "Sound Design za Mobile Games: Original SFX library, industry standard kvalitet, kolaborativan pristup.", highlight: "Mobile Game Audio" },
    { indices: [2, 2, 2, 2, 2], story: "Audio Mastering za Trailers: Premium kvalitet finalnog miksa sa iterativnim procesom.", highlight: "Trailer Mastering" }
  ],
  generateStory: (indices, reels) => {
    const service = reels[0][indices[0] % reels[0].length]
    const platform = reels[1][indices[1] % reels[1].length]
    const deliverable = reels[2][indices[2] % reels[2].length]
    const quality = reels[3][indices[3] % reels[3].length]
    const turnaround = reels[4][indices[4] % reels[4].length]
    return `${service.label} za ${platform.label}: ${deliverable.label}. ${quality.label} kvalitet. ${turnaround.label}.`
  }
}

// ============================================
// ABOUT SEGMENT - Personal Info
// ============================================
const ABOUT_CONFIG: SegmentReelConfig = {
  title: 'ABOUT',
  subtitle: 'Bojan Petkovic',
  reels: [
    // Reel 1: Identity
    [
      { icon: '👨‍🎤', label: 'Audio Producer', color: '#8844ff' },
      { icon: '🎵', label: 'Composer', color: '#ff00aa' },
      { icon: '🔊', label: 'Sound Designer', color: '#00ffff' }
    ],
    // Reel 2: Background
    [
      { icon: '🎓', label: 'SAE Institute', color: '#8844ff' },
      { icon: '🎹', label: 'BA Music', color: '#ff00aa' },
      { icon: '📜', label: 'Classical Training', color: '#ffd700' }
    ],
    // Reel 3: Experience
    [
      { icon: '🔟', label: '10+ Years', color: '#ffd700' },
      { icon: '🎰', label: 'Game Industry', color: '#00ffff' },
      { icon: '🌍', label: 'International', color: '#00ff88' }
    ],
    // Reel 4: Location
    [
      { icon: '📍', label: 'Belgrade', color: '#ff00aa' },
      { icon: '🇷🇸', label: 'Serbia', color: '#00ffff' },
      { icon: '🌐', label: 'Remote', color: '#00ff88' }
    ],
    // Reel 5: Trait
    [
      { icon: '✨', label: 'High Quality', color: '#ffd700' },
      { icon: '🎯', label: 'Consistent', color: '#00ff88' },
      { icon: '🤝', label: 'Collaborative', color: '#00ffff' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "Audio Producer sa SAE Institute obrazovanjem. 10+ godina iskustva u gaming industriji. Beograd, Srbija. Poznat po visokom kvalitetu rada.", highlight: "Founder of VanVinkl Studio" },
    { indices: [1, 1, 1, 1, 1], story: "Composer sa BA diplomom iz muzike. Klasična obuka + gaming industrija. Remote saradnja sa klijentima širom sveta.", highlight: "Classical + Digital" },
    { indices: [2, 2, 2, 2, 2], story: "Sound Designer sa klasičnom obukom. Međunarodno iskustvo u game audio produkciji. Kolaborativan pristup.", highlight: "10+ Years Experience" }
  ],
  generateStory: (indices, reels) => {
    const identity = reels[0][indices[0] % reels[0].length]
    const bg = reels[1][indices[1] % reels[1].length]
    const exp = reels[2][indices[2] % reels[2].length]
    const loc = reels[3][indices[3] % reels[3].length]
    const trait = reels[4][indices[4] % reels[4].length]
    return `${identity.label} • ${bg.label} • ${exp.label} iskustva • ${loc.label} • ${trait.label}`
  }
}

// ============================================
// PROJECTS SEGMENT - Portfolio
// ============================================
const PROJECTS_CONFIG: SegmentReelConfig = {
  title: 'PROJECTS',
  subtitle: 'Portfolio',
  reels: [
    // Reel 1: Project Type
    [
      { icon: '🎰', label: 'Slot Games', color: '#ffd700' },
      { icon: '📱', label: 'Mobile Titles', color: '#00ffff' },
      { icon: '🎬', label: 'Trailers', color: '#ff00aa' },
      { icon: '🎮', label: 'Game Audio', color: '#00ff88' }
    ],
    // Reel 2: Scale
    [
      { icon: '📊', label: '50+ Projects', color: '#ffd700' },
      { icon: '🌍', label: 'International', color: '#00ffff' },
      { icon: '🏢', label: 'B2B', color: '#8844ff' }
    ],
    // Reel 3: Role
    [
      { icon: '🎼', label: 'Full Score', color: '#ff00aa' },
      { icon: '🔊', label: 'SFX Design', color: '#00ffff' },
      { icon: '🎚️', label: 'Mix & Master', color: '#8844ff' },
      { icon: '⚙️', label: 'Implementation', color: '#00ff88' }
    ],
    // Reel 4: Client
    [
      { icon: '🏢', label: 'IGT', color: '#ff00aa' },
      { icon: '🎮', label: 'Game Studios', color: '#00ffff' },
      { icon: '🌐', label: 'Global Clients', color: '#ffd700' }
    ],
    // Reel 5: Result
    [
      { icon: '✅', label: 'Shipped', color: '#00ff88' },
      { icon: '🏆', label: 'Award Quality', color: '#ffd700' },
      { icon: '⭐', label: 'Client Approved', color: '#00ffff' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "Slot Games: 50+ projekata sa full score-om za IGT. Svi projekti uspešno isporučeni i odobreni.", highlight: "50+ Slot Soundtracks" },
    { indices: [1, 1, 1, 1, 1], story: "Mobile Titles: Međunarodni B2B projekti sa kompletnim SFX dizajnom za game studios.", highlight: "International Mobile Games" },
    { indices: [2, 2, 2, 2, 2], story: "Trailers: Mix & Master za globalne klijente. Award quality produkcija.", highlight: "Cinematic Trailers" }
  ],
  generateStory: (indices, reels) => {
    const type = reels[0][indices[0] % reels[0].length]
    const scale = reels[1][indices[1] % reels[1].length]
    const role = reels[2][indices[2] % reels[2].length]
    const client = reels[3][indices[3] % reels[3].length]
    const result = reels[4][indices[4] % reels[4].length]
    return `${type.label}: ${scale.label}. Uloga: ${role.label}. Klijent: ${client.label}. Status: ${result.label}.`
  }
}

// ============================================
// CONTACT SEGMENT
// ============================================
const CONTACT_CONFIG: SegmentReelConfig = {
  title: 'CONTACT',
  subtitle: 'Get In Touch',
  reels: [
    // Reel 1: Method
    [
      { icon: '📧', label: 'Email', color: '#ff4444' },
      { icon: '💼', label: 'LinkedIn', color: '#0077b5' },
      { icon: '📱', label: 'Phone', color: '#00ff88' }
    ],
    // Reel 2: Purpose
    [
      { icon: '🎵', label: 'Music Project', color: '#ff00aa' },
      { icon: '🔊', label: 'Sound Design', color: '#00ffff' },
      { icon: '🤝', label: 'Collaboration', color: '#8844ff' },
      { icon: '💬', label: 'Inquiry', color: '#ffd700' }
    ],
    // Reel 3: Timeline
    [
      { icon: '⚡', label: 'ASAP', color: '#ff4444' },
      { icon: '📅', label: 'This Month', color: '#ffd700' },
      { icon: '🗓️', label: 'Flexible', color: '#00ff88' }
    ],
    // Reel 4: Budget
    [
      { icon: '💎', label: 'Premium', color: '#ffd700' },
      { icon: '💰', label: 'Standard', color: '#00ff88' },
      { icon: '🤝', label: 'Negotiable', color: '#00ffff' }
    ],
    // Reel 5: Response
    [
      { icon: '✅', label: 'Available', color: '#00ff88' },
      { icon: '⏰', label: '24h Response', color: '#ffd700' },
      { icon: '🌍', label: 'Worldwide', color: '#00ffff' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "📧 vanvinklstudio@gmail.com - Za music projekte. Brz odgovor garantovan. Premium i standard opcije dostupne.", highlight: "vanvinklstudio@gmail.com" },
    { indices: [1, 1, 1, 1, 1], story: "💼 LinkedIn - Profesionalna saradnja i networking. Fleksibilan timeline. Dostupan za worldwide projekte.", highlight: "LinkedIn Connection" },
    { indices: [2, 2, 2, 2, 2], story: "📱 +381694000062 - Direktan kontakt za hitne projekte. 24h response time.", highlight: "+381 69 400 0062" }
  ],
  generateStory: (indices, reels) => {
    const method = reels[0][indices[0] % reels[0].length]
    const purpose = reels[1][indices[1] % reels[1].length]
    const timeline = reels[2][indices[2] % reels[2].length]
    const budget = reels[3][indices[3] % reels[3].length]
    const response = reels[4][indices[4] % reels[4].length]
    return `Kontakt: ${method.label} za ${purpose.label}. Timeline: ${timeline.label}. Budget: ${budget.label}. ${response.label}.`
  }
}

// ============================================
// SEGMENT CONFIG MAP
// ============================================
const SEGMENT_CONFIGS: Record<string, SegmentReelConfig> = {
  skills: SKILLS_CONFIG,
  experience: EXPERIENCE_CONFIG,
  services: SERVICES_CONFIG,
  about: ABOUT_CONFIG,
  projects: PROJECTS_CONFIG,
  contact: CONTACT_CONFIG
}

// Get config for machine or default to skills
function getSegmentConfig(machineId: string): SegmentReelConfig {
  return SEGMENT_CONFIGS[machineId] || SKILLS_CONFIG
}


export {
  SKILLS_CONFIG,
  EXPERIENCE_CONFIG,
  SERVICES_CONFIG,
  ABOUT_CONFIG,
  PROJECTS_CONFIG,
  CONTACT_CONFIG,
  SEGMENT_CONFIGS,
  getSegmentConfig,
  SLOT_THEMES
}
