export const DANCE_STYLES = [
  'Salsa', 'Bachata', 'Tango', 'Kizomba', 'Zouk',
  'Swing', 'Foxtrot', 'Waltz', 'Cha-Cha', 'Rumba',
  'Jive', 'Quickstep', 'Disco', 'Hip-Hop', 'Breakdance',
  'Zumba', 'Bale', 'Modern Dans', 'Halk Oyunları', 'Vals'
] as const;

export const DANCE_STYLE_IMAGE_MAPPING: { [key: string]: string } = {
  'Salsa': 'salsa',
  'Bachata': 'bachata',
  'Kizomba': 'kizomba',
  'Tango': 'tango',
  'Modern Dans': 'moderndance',
  'Modern': 'moderndance',
  'Halk Oyunları': 'halkoyunlari',
  'Bale': 'bale',
  'Zumba': 'zumba',
  'Swing': 'swing',
  'Foxtrot': 'foxtrot',
  'Waltz': 'waltz',
  'Cha-Cha': 'cha-cha',
  'Rumba': 'rumba',
  'Jive': 'jive',
  'Quickstep': 'quickstep',
  'Disco': 'disco',
  'Hip-Hop': 'hip-hop',
  'Breakdance': 'breakdance',
  'Zouk': 'zouk',
  'Vals': 'vals',
};

export type DanceStyle = typeof DANCE_STYLES[number];

export const DANCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'] as const;

export type DanceLevel = typeof DANCE_LEVELS[number];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
} as const;

export const DURATION_OPTIONS = [45, 60, 90] as const;

export const DANCE_STYLE_DESCRIPTIONS: Record<string, { tr: string; en: string }> = {
  'Salsa': {
    tr: 'Bu kurs, Salsa dansının temel adımlarını ve ritim anlayışını öğretmek için tasarlanmıştır. Hem yeni başlayanlar hem de teknik geliştirmek isteyen dansçılar için uygundur.',
    en: 'This course is designed to teach the fundamental steps and rhythm of Salsa dancing. Suitable for beginners and those looking to refine their technique.',
  },
  'Bachata': {
    tr: 'Bachata kursunda dansın hem teknik hem de duygusal boyutunu keşfedeceksiniz. Temel adımlardan figure kalıplarına kadar kapsamlı bir program sizi bekliyor.',
    en: 'In this Bachata course, you will explore both the technical and emotional dimensions of the dance. A comprehensive program awaits you, from basic steps to figure patterns.',
  },
  'Tango': {
    tr: 'Arjantin Tango\'nun büyüleyici dünyasına adım atın. Bu kurs; yürüyüş, bağlantı ve doğaçlama konularında sizi adım adım ilerletecek şekilde tasarlanmıştır.',
    en: 'Step into the captivating world of Argentine Tango. This course is designed to progressively guide you through walking, connection, and improvisation.',
  },
  'Kizomba': {
    tr: 'Kizomba, Afrika kökenli samimi ve bağlantı odaklı bir dans türüdür. Bu kurs temel ginga hareketi, partnerle bağlantı ve müzikalite üzerine yoğunlaşmaktadır.',
    en: 'Kizomba is an intimate, connection-focused dance of African origin. This course focuses on the basic ginga movement, partner connection, and musicality.',
  },
  'Zouk': {
    tr: 'Brezilya Zouk dansının akıcı ve dinamik dünyasını keşfedin. Vücut dalgalanmaları, baş hareketleri ve partnerle uyum bu kursun temel odak noktalarıdır.',
    en: 'Discover the fluid and dynamic world of Brazilian Zouk. Body waves, head movements, and partner sync are the core focus of this course.',
  },
  'Swing': {
    tr: 'Swing dansı neşeli, enerjik ve sosyal bir dans türüdür. Bu kurs Lindy Hop veya East Coast Swing temellerini öğrenmek isteyenler için idealdir.',
    en: 'Swing dancing is a joyful, energetic, and social dance style. This course is ideal for those who want to learn the basics of Lindy Hop or East Coast Swing.',
  },
  'Foxtrot': {
    tr: 'Foxtrot, zarif ve akıcı balo salonu danslarından biridir. Bu kurs temel figürler, postür ve müzikle uyum üzerine odaklanmaktadır.',
    en: 'Foxtrot is one of the elegant and flowing ballroom dances. This course focuses on basic figures, posture, and musical alignment.',
  },
  'Waltz': {
    tr: 'Viyana Vals\'ının romantik dünyasına hoş geldiniz. Bu kurs temel vals adımlarını, dönüş tekniklerini ve zarif postürü kapsamaktadır.',
    en: 'Welcome to the romantic world of the Waltz. This course covers basic waltz steps, turning techniques, and elegant posture.',
  },
  'Cha-Cha': {
    tr: 'Cha-Cha, canlı ritmiyle dans pistinin favorisi! Bu kurs temel Cha-Cha figürlerini, Latin kalça hareketini ve partnerle uyumu öğretmektedir.',
    en: 'Cha-Cha is a dance floor favorite with its lively rhythm! This course teaches basic Cha-Cha figures, Latin hip motion, and partner synchronization.',
  },
  'Rumba': {
    tr: 'Latin danslarının "aşk dansı" olarak bilinen Rumba\'yı öğrenin. Bu kurs; yavaş, duygu yüklü hareketleri ve partnerle duygusal bağı kapsamaktadır.',
    en: 'Learn the Rumba, known as the "dance of love" among Latin dances. This course covers slow, emotion-filled movements and emotional connection with your partner.',
  },
  'Jive': {
    tr: 'Jive, canlı ve tempolu Latin danslarından biridir. Bu kurs kick ve flick tekniklerini, hızlı adım koordinasyonunu ve müzik uyumunu kapsamaktadır.',
    en: 'Jive is one of the lively and fast-paced Latin dances. This course covers kick and flick techniques, quick step coordination, and musical alignment.',
  },
  'Quickstep': {
    tr: 'Quickstep\'in hızlı ve enerjik dünyasına adım atın. Bu kurs temel yürüyüş figürlerini, hız kontrolünü ve balo salonu postürünü ele almaktadır.',
    en: 'Step into the fast and energetic world of Quickstep. This course covers basic walking figures, speed control, and ballroom posture.',
  },
  'Disco': {
    tr: 'Disco dansının renkli ve eğlenceli dünyasına katılın! Bu kurs temel disco figürlerini, serbest stil hareketleri ve ritim egzersizlerini içermektedir.',
    en: 'Join the colorful and fun world of Disco dancing! This course includes basic disco figures, freestyle movements, and rhythm exercises.',
  },
  'Hip-Hop': {
    tr: 'Hip-Hop dansında özgün tarzınızı keşfedin. Freestyle, battling ve koreografi unsurlarını bir arada öğreteceğimiz bu kurs tüm seviyelere açıktır.',
    en: 'Discover your unique style in Hip-Hop dance. This course, which teaches freestyle, battling, and choreography elements together, is open to all levels.',
  },
  'Breakdance': {
    tr: 'Breakdance; güç, ritim ve yaratıcılığın birleştiği b-boy/b-girl kültürünün kalbi. Bu kurs toprock, footwork ve freeze temellerini öğretmektedir.',
    en: 'Breakdance is the heart of b-boy/b-girl culture where power, rhythm, and creativity meet. This course teaches toprock, footwork, and freeze fundamentals.',
  },
  'Zumba': {
    tr: 'Müzikle eğlenirken fit kalın! Zumba, Latin ritimlerini eğlenceli bir egzersizle birleştiren enerji dolu bir dans fitness programıdır.',
    en: 'Stay fit while having fun with music! Zumba is an energetic dance fitness program that combines Latin rhythms with enjoyable exercise.',
  },
  'Bale': {
    tr: 'Klasik bale tekniklerini ve sahneleme disiplinini öğrenin. Bu kurs barre egzersizlerinden centre çalışmasına kadar geniş bir içerik sunmaktadır.',
    en: 'Learn classical ballet techniques and stage discipline. This course offers a wide range of content from barre exercises to centre work.',
  },
  'Modern Dans': {
    tr: 'Modern dans; bedenin özgür ifadesini teşvik eden çağdaş bir dans formudur. Bu kursta temel modern teknikler ve yaratıcı hareket keşifleri işlenecektir.',
    en: 'Modern dance is a contemporary dance form that encourages the free expression of the body. This course will cover basic modern techniques and creative movement explorations.',
  },
  'Halk Oyunları': {
    tr: 'Anadolu\'nun zengin kültürel mirasını yansıtan halk oyunlarını öğrenin. Bu kurs yöresel kıyafetler, figürler ve müzik kültürünü kapsamlı şekilde ele almaktadır.',
    en: 'Learn folk dances that reflect the rich cultural heritage of Anatolia. This course comprehensively covers regional costumes, figures, and music culture.',
  },
  'Vals': {
    tr: 'Klasik Viyana Vals\'ından modern yorumlara uzanan geniş bir yelpazede dans etmeyi öğrenin. Bu kurs temel figürler, dönme teknikleri ve müzik uyumunu içerir.',
    en: 'Learn to dance across a wide spectrum from classical Viennese Waltz to modern interpretations. This course includes basic figures, rotation techniques, and musical alignment.',
  },
};

