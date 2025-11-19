import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (optional - comment out in production)
  console.log('Clearing existing data...');
  await prisma.reflection.deleteMany();
  await prisma.userCard.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.question.deleteMany();
  await prisma.slide.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.world.deleteMany();
  await prisma.card.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  console.log('Creating test user...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const testUser = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
      languagePreference: 'en',
      dailyGoalXP: 10,
      totalXP: 0,
      hearts: 5,
      maxHearts: 5,
    },
  });
  console.log('✅ Created test user:', testUser.email);

  // Create Worlds - The 14 Worlds of RealPath
  console.log('Creating worlds...');
  
  const world1 = await prisma.world.create({
    data: {
      nameEn: 'Foundations',
      nameSi: 'මුල්ම පදනම',
      orderIndex: 1,
      themeKey: 'foundations',
      isActive: true,
    },
  });

  const world2 = await prisma.world.create({
    data: {
      nameEn: 'The Four Noble Truths',
      nameSi: 'සතර අරි‍ය සත්‍ය',
      orderIndex: 2,
      themeKey: 'four_noble_truths',
      isActive: true,
    },
  });

  const world3 = await prisma.world.create({
    data: {
      nameEn: 'The Noble Eightfold Path',
      nameSi: 'අටංගික මාර්ගය',
      orderIndex: 3,
      themeKey: 'eightfold_path',
      isActive: true,
    },
  });

  const world4 = await prisma.world.create({
    data: {
      nameEn: 'Dhammapada Essentials',
      nameSi: 'ධම්මපද මූලික අර්ථ',
      orderIndex: 4,
      themeKey: 'dhammapada',
      isActive: true,
    },
  });

  const world5 = await prisma.world.create({
    data: {
      nameEn: 'Majjhima Nikāya Essentials',
      nameSi: 'මජ්ජිම නිකාය මූලික පදනම',
      orderIndex: 5,
      themeKey: 'sutta_stories',
      isActive: true,
    },
  });

  const world6 = await prisma.world.create({
    data: {
      nameEn: 'Dīgha Nikāya Themes',
      nameSi: 'ධීඝ නිකාය — දිගු සූත්‍ර අර්ථ',
      orderIndex: 6,
      themeKey: 'sutta_stories',
      isActive: true,
    },
  });

  const world7 = await prisma.world.create({
    data: {
      nameEn: 'Saṁyutta Nikāya (Grouped Teachings)',
      nameSi: 'සංයුත්ත නිකාය (සමූහ දහම්)',
      orderIndex: 7,
      themeKey: 'sutta_stories',
      isActive: true,
    },
  });

  const world8 = await prisma.world.create({
    data: {
      nameEn: 'Aṅguttara Nikāya (Numbered Teachings)',
      nameSi: 'අඞ්ගුත්තර නිකාය (සංඛ්‍යාත දහම්)',
      orderIndex: 8,
      themeKey: 'sutta_stories',
      isActive: true,
    },
  });

  const world9 = await prisma.world.create({
    data: {
      nameEn: 'Khuddaka Nikāya (Short Teachings)',
      nameSi: 'කුද්දක නිකාය (කෙටි දහම්)',
      orderIndex: 9,
      themeKey: 'sutta_stories',
      isActive: true,
    },
  });

  const world10 = await prisma.world.create({
    data: {
      nameEn: 'Jātaka Tales',
      nameSi: 'ජාතක කතා (බුදුන්ගේ පූර්ව ජන්ම කථා)',
      orderIndex: 10,
      themeKey: 'sutta_stories',
      isActive: true,
    },
  });

  const world11 = await prisma.world.create({
    data: {
      nameEn: 'Vinaya (Discipline & Ethical Living)',
      nameSi: 'විනය — නීතිමය සීලී ජීවිතය',
      orderIndex: 11,
      themeKey: 'sutta_stories',
      isActive: true,
    },
  });

  const world12 = await prisma.world.create({
    data: {
      nameEn: 'Abhidhamma Basics',
      nameSi: 'අභිධර්ම මූලිකයන් (මනෝ විද්‍යාව)',
      orderIndex: 12,
      themeKey: 'sutta_stories',
      isActive: true,
    },
  });

  const world13 = await prisma.world.create({
    data: {
      nameEn: 'Meditation World',
      nameSi: 'භාවනා ලෝකය (සතිය හා සමාධිය)',
      orderIndex: 13,
      themeKey: 'mindfulness',
      isActive: true,
    },
  });

  const world14 = await prisma.world.create({
    data: {
      nameEn: 'Life Wisdom World',
      nameSi: 'ජීවන ප්‍රඥා ලෝකය',
      orderIndex: 14,
      themeKey: 'mindfulness',
      isActive: true,
    },
  });

  console.log('✅ Created 14 worlds');

  // Create Chapters for World 1 (Foundations) - 9 Chapters, 30 Lessons
  console.log('Creating chapters...');
  
  // Chapter 1: What is Buddhism? (3 lessons)
  const chapter1 = await prisma.chapter.create({
    data: {
      worldId: world1.id,
      nameEn: 'What is Buddhism?',
      nameSi: 'බෞද්ධාගම යනු කුමක්ද?',
      orderIndex: 1,
    },
  });

  // Chapter 2: Who is the Buddha? (4 lessons)
  const chapter2 = await prisma.chapter.create({
    data: {
      worldId: world1.id,
      nameEn: 'Who is the Buddha?',
      nameSi: 'බුදුරජාණන් වහන්සේ කවුද?',
      orderIndex: 2,
    },
  });

  // Chapter 3: What is Dhamma? (4 lessons)
  const chapter3 = await prisma.chapter.create({
    data: {
      worldId: world1.id,
      nameEn: 'What is Dhamma?',
      nameSi: 'ධර්මය යනු කුමක්ද?',
      orderIndex: 3,
    },
  });

  // Chapter 4: What is Saṅgha? (3 lessons)
  const chapter4 = await prisma.chapter.create({
    data: {
      worldId: world1.id,
      nameEn: 'What is Saṅgha?',
      nameSi: 'සංඝයා යනු කුමක්ද?',
      orderIndex: 4,
    },
  });

  // Chapter 5: What is the Tripiṭaka? (4 lessons)
  const chapter5 = await prisma.chapter.create({
    data: {
      worldId: world1.id,
      nameEn: 'What is the Tripiṭaka?',
      nameSi: 'ත්‍රිපිටකය යනු කුමක්ද?',
      orderIndex: 5,
    },
  });

  // Chapter 6: Kamma (Karma) (4 lessons)
  const chapter6 = await prisma.chapter.create({
    data: {
      worldId: world1.id,
      nameEn: 'Kamma (Karma)',
      nameSi: 'කර්මය',
      orderIndex: 6,
    },
  });

  // Chapter 7: Rebirth (Punabbhava) (3 lessons)
  const chapter7 = await prisma.chapter.create({
    data: {
      worldId: world1.id,
      nameEn: 'Rebirth (Punabbhava)',
      nameSi: 'පුනර්ජන්මය',
      orderIndex: 7,
    },
  });

  // Chapter 8: Dukkha (Suffering / Unsatisfactoriness) (4 lessons)
  const chapter8 = await prisma.chapter.create({
    data: {
      worldId: world1.id,
      nameEn: 'Dukkha (Suffering / Unsatisfactoriness)',
      nameSi: 'දුක්ඛය',
      orderIndex: 8,
    },
  });

  // Chapter 9: Summary + Integration (1 lesson)
  const chapter9 = await prisma.chapter.create({
    data: {
      worldId: world1.id,
      nameEn: 'Summary + Integration',
      nameSi: 'සාරාංශය + ඒකාබද්ධ කිරීම',
      orderIndex: 9,
    },
  });

  // Create Chapters for World 2 (Four Noble Truths)
  const chapter10 = await prisma.chapter.create({
    data: {
      worldId: world2.id,
      nameEn: 'The First Noble Truth: Dukkha',
      nameSi: 'පළමු ආර්ය සත්‍යය: දුක්ඛ',
      orderIndex: 1,
    },
  });

  const chapter11 = await prisma.chapter.create({
    data: {
      worldId: world2.id,
      nameEn: 'The Second Noble Truth: Craving',
      nameSi: 'දෙවන ආර්ය සත්‍යය: තණ්හා',
      orderIndex: 2,
    },
  });

  const chapter12 = await prisma.chapter.create({
    data: {
      worldId: world2.id,
      nameEn: 'The Third & Fourth Noble Truths',
      nameSi: 'තෙවන සහ සිව්වන ආර්ය සත්‍ය',
      orderIndex: 3,
    },
  });

  // Create Chapters for World 3 (Noble Eightfold Path)
  const chapter13 = await prisma.chapter.create({
    data: {
      worldId: world3.id,
      nameEn: 'Wisdom Group',
      nameSi: 'ප්‍රඥා කණ්ඩායම',
      orderIndex: 1,
    },
  });

  const chapter14 = await prisma.chapter.create({
    data: {
      worldId: world3.id,
      nameEn: 'Ethical Conduct Group',
      nameSi: 'ශීල කණ්ඩායම',
      orderIndex: 2,
    },
  });

  const chapter15 = await prisma.chapter.create({
    data: {
      worldId: world3.id,
      nameEn: 'Mental Development Group',
      nameSi: 'සමාධි කණ්ඩායම',
      orderIndex: 3,
    },
  });

  // Create Chapters for World 4 (Dhammapada Essentials)
  const chapter16 = await prisma.chapter.create({
    data: {
      worldId: world4.id,
      nameEn: 'The Pairs',
      nameSi: 'යුගල',
      orderIndex: 1,
    },
  });

  // Create Chapters for World 5 (Majjhima Nikāya)
  const chapter17 = await prisma.chapter.create({
    data: {
      worldId: world5.id,
      nameEn: 'Anapanasati',
      nameSi: 'ආනාපාන සති',
      orderIndex: 1,
    },
  });

  // Create Chapters for World 13 (Meditation World)
  const chapter18 = await prisma.chapter.create({
    data: {
      worldId: world13.id,
      nameEn: 'Breath Meditation',
      nameSi: 'ආනාපාන භාවනා',
      orderIndex: 1,
    },
  });

  const chapter19 = await prisma.chapter.create({
    data: {
      worldId: world13.id,
      nameEn: 'Loving-Kindness',
      nameSi: 'මෙත්තා',
      orderIndex: 2,
    },
  });

  // Create Chapters for World 14 (Life Wisdom World)
  const chapter20 = await prisma.chapter.create({
    data: {
      worldId: world14.id,
      nameEn: 'Dealing with Emotions',
      nameSi: 'චිත්තවේග සමඟ කටයුතු කිරීම',
      orderIndex: 1,
    },
  });

  const chapter21 = await prisma.chapter.create({
    data: {
      worldId: world14.id,
      nameEn: 'Relationships & Work',
      nameSi: 'සබඳතා සහ වැඩ',
      orderIndex: 2,
    },
  });

  console.log('✅ Created 21 chapters (9 for World 1 + 12 for other worlds)');

  // Create 30 Lessons for World 1 (Foundations)
  console.log('Creating lessons...');
  
  // Chapter 1: What is Buddhism? (3 lessons)
  const lesson1 = await prisma.lesson.create({
    data: {
      chapterId: chapter1.id,
      slug: 'buddhism-as-a-path',
      titleEn: 'Buddhism as a path',
      titleSi: 'බෞද්ධාගම මාර්ගයක් ලෙස',
      orderIndex: 1,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson2 = await prisma.lesson.create({
    data: {
      chapterId: chapter1.id,
      slug: 'goals-of-buddhist-path',
      titleEn: 'Goals of the Buddhist path',
      titleSi: 'බෞද්ධ මාර්ගයේ අරමුණු',
      orderIndex: 2,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson3 = await prisma.lesson.create({
    data: {
      chapterId: chapter1.id,
      slug: 'misconceptions-removed',
      titleEn: 'Misconceptions removed',
      titleSi: 'වැරදි අදහස් ඉවත් කිරීම',
      orderIndex: 3,
      xpReward: 10,
      isActive: true,
    },
  });

  // Chapter 2: Who is the Buddha? (4 lessons)
  const lesson4 = await prisma.lesson.create({
    data: {
      chapterId: chapter2.id,
      slug: 'prince-siddhartha',
      titleEn: 'Prince Siddhartha',
      titleSi: 'සිද්ධාර්ථ කුමාරයා',
      orderIndex: 1,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson5 = await prisma.lesson.create({
    data: {
      chapterId: chapter2.id,
      slug: 'the-great-renunciation',
      titleEn: 'The Great Renunciation',
      titleSi: 'මහා පැවිදි',
      orderIndex: 2,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson6 = await prisma.lesson.create({
    data: {
      chapterId: chapter2.id,
      slug: 'enlightenment',
      titleEn: 'Enlightenment',
      titleSi: 'බුද්ධත්වය',
      orderIndex: 3,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson7 = await prisma.lesson.create({
    data: {
      chapterId: chapter2.id,
      slug: 'buddha-as-teacher-not-god',
      titleEn: 'The Buddha as teacher, not god',
      titleSi: 'බුදුන් වහන්සේ ගුරුවරයෙක්, දෙවියෙක් නොවේ',
      orderIndex: 4,
      xpReward: 10,
      isActive: true,
    },
  });

  // Chapter 3: What is Dhamma? (4 lessons)
  const lesson8 = await prisma.lesson.create({
    data: {
      chapterId: chapter3.id,
      slug: 'dhamma-as-natural-law',
      titleEn: 'Dhamma as natural law',
      titleSi: 'ධර්මය ස්වභාවික නියමයක් ලෙස',
      orderIndex: 1,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson9 = await prisma.lesson.create({
    data: {
      chapterId: chapter3.id,
      slug: 'dhamma-as-teachings',
      titleEn: 'Dhamma as teachings',
      titleSi: 'ධර්මය ඉගැන්වීම් ලෙස',
      orderIndex: 2,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson10 = await prisma.lesson.create({
    data: {
      chapterId: chapter3.id,
      slug: 'dhamma-as-practice',
      titleEn: 'Dhamma as practice',
      titleSi: 'ධර්මය පිළිපැදීමක් ලෙස',
      orderIndex: 3,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson11 = await prisma.lesson.create({
    data: {
      chapterId: chapter3.id,
      slug: 'dhamma-as-refuge',
      titleEn: 'Dhamma as refuge',
      titleSi: 'ධර්මය සරණයක් ලෙස',
      orderIndex: 4,
      xpReward: 10,
      isActive: true,
    },
  });

  // Chapter 4: What is Saṅgha? (3 lessons)
  const lesson12 = await prisma.lesson.create({
    data: {
      chapterId: chapter4.id,
      slug: 'enlightened-disciples',
      titleEn: 'Enlightened disciples',
      titleSi: 'ඇහැරුණු ශිෂ්‍යයන්',
      orderIndex: 1,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson13 = await prisma.lesson.create({
    data: {
      chapterId: chapter4.id,
      slug: 'monastic-community',
      titleEn: 'Monastic community',
      titleSi: 'භික්ෂු සංඝයා',
      orderIndex: 2,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson14 = await prisma.lesson.create({
    data: {
      chapterId: chapter4.id,
      slug: 'lay-community',
      titleEn: 'Lay community',
      titleSi: 'ගිහි ප්‍රජාව',
      orderIndex: 3,
      xpReward: 10,
      isActive: true,
    },
  });

  // Chapter 5: What is the Tripiṭaka? (4 lessons)
  const lesson15 = await prisma.lesson.create({
    data: {
      chapterId: chapter5.id,
      slug: 'the-three-baskets',
      titleEn: 'The Three Baskets',
      titleSi: 'ත්‍රිපිටකය',
      orderIndex: 1,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson16 = await prisma.lesson.create({
    data: {
      chapterId: chapter5.id,
      slug: 'vinaya-pitaka',
      titleEn: 'Vinaya Pitaka',
      titleSi: 'විනය පිටකය',
      orderIndex: 2,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson17 = await prisma.lesson.create({
    data: {
      chapterId: chapter5.id,
      slug: 'sutta-pitaka',
      titleEn: 'Sutta Pitaka',
      titleSi: 'සූත්‍ර පිටකය',
      orderIndex: 3,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson18 = await prisma.lesson.create({
    data: {
      chapterId: chapter5.id,
      slug: 'abhidhamma-pitaka',
      titleEn: 'Abhidhamma Pitaka',
      titleSi: 'අභිධර්ම පිටකය',
      orderIndex: 4,
      xpReward: 10,
      isActive: true,
    },
  });

  // Chapter 6: Kamma (Karma) (4 lessons)
  const lesson19 = await prisma.lesson.create({
    data: {
      chapterId: chapter6.id,
      slug: 'what-is-kamma',
      titleEn: 'What is Kamma?',
      titleSi: 'කර්මය යනු කුමක්ද?',
      orderIndex: 1,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson20 = await prisma.lesson.create({
    data: {
      chapterId: chapter6.id,
      slug: 'intention-cetana-is-key',
      titleEn: 'Intention (Cetanā) is key',
      titleSi: 'චේතනාව (අභිප්‍රාය) මූලිකය',
      orderIndex: 2,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson21 = await prisma.lesson.create({
    data: {
      chapterId: chapter6.id,
      slug: 'wholesome-vs-unwholesome',
      titleEn: 'Wholesome vs unwholesome actions',
      titleSi: 'කුශල හා අකුශල ක්‍රියා',
      orderIndex: 3,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson22 = await prisma.lesson.create({
    data: {
      chapterId: chapter6.id,
      slug: 'results-of-kamma',
      titleEn: 'Results of Kamma',
      titleSi: 'කර්මයේ ප්‍රතිඵල',
      orderIndex: 4,
      xpReward: 10,
      isActive: true,
    },
  });

  // Chapter 7: Rebirth (Punabbhava) (3 lessons)
  const lesson23 = await prisma.lesson.create({
    data: {
      chapterId: chapter7.id,
      slug: 'what-is-rebirth',
      titleEn: 'What is rebirth?',
      titleSi: 'පුනර්ජන්මය යනු කුමක්ද?',
      orderIndex: 1,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson24 = await prisma.lesson.create({
    data: {
      chapterId: chapter7.id,
      slug: 'continuity-without-soul',
      titleEn: 'Continuity without a soul',
      titleSi: 'ආත්මයක් නොමැති අඛණ්ඩතාව',
      orderIndex: 2,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson25 = await prisma.lesson.create({
    data: {
      chapterId: chapter7.id,
      slug: 'rebirth-examples-analogies',
      titleEn: 'Real-life examples + analogies',
      titleSi: 'සැබෑ ජීවිත උදාහරණ + උපමා',
      orderIndex: 3,
      xpReward: 10,
      isActive: true,
    },
  });

  // Chapter 8: Dukkha (Suffering / Unsatisfactoriness) (4 lessons)
  const lesson26 = await prisma.lesson.create({
    data: {
      chapterId: chapter8.id,
      slug: 'definition-of-dukkha',
      titleEn: 'Definition of Dukkha',
      titleSi: 'දුක්ඛයේ අර්ථ දැක්වීම',
      orderIndex: 1,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson27 = await prisma.lesson.create({
    data: {
      chapterId: chapter8.id,
      slug: 'types-of-dukkha',
      titleEn: 'Types of Dukkha',
      titleSi: 'දුක්ඛයේ වර්ග',
      orderIndex: 2,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson28 = await prisma.lesson.create({
    data: {
      chapterId: chapter8.id,
      slug: 'why-dukkha-exists',
      titleEn: 'Why Dukkha exists',
      titleSi: 'දුක්ඛය පවතින්නේ ඇයි?',
      orderIndex: 3,
      xpReward: 10,
      isActive: true,
    },
  });
  const lesson29 = await prisma.lesson.create({
    data: {
      chapterId: chapter8.id,
      slug: 'everyday-examples-dukkha',
      titleEn: 'Everyday examples',
      titleSi: 'දෛනික උදාහරණ',
      orderIndex: 4,
      xpReward: 10,
      isActive: true,
    },
  });

  // Chapter 9: Summary + Integration (1 lesson)
  const lesson30 = await prisma.lesson.create({
    data: {
      chapterId: chapter9.id,
      slug: 'summary-integration',
      titleEn: 'Summary + small test + reflection',
      titleSi: 'සාරාංශය + කුඩා පරීක්ෂණය + අවබෝධය',
      orderIndex: 1,
      xpReward: 15,
      isActive: true,
    },
  });

  console.log('✅ Created 30 lessons for World 1 (Foundations)');

  // Create Slides for Lesson 1 (Buddhism as a path) - Template
  console.log('Creating slides...');
  await prisma.slide.createMany({
    data: [
      {
        lessonId: lesson1.id,
        orderIndex: 1,
        type: 'explanation',
        contentEn: 'Buddhism is not just a religion or philosophy—it is a practical path to understanding life and finding peace.',
        contentSi: 'බෞද්ධාගම යනු ආගමක් හෝ දර්ශනයක් පමණක් නොවේ—එය ජීවිතය අවබෝධ කර ගැනීමට සහ සාමය සොයා ගැනීමට ප්‍රායෝගික මාර්ගයකි.',
        imageUrl: null,
      },
      {
        lessonId: lesson1.id,
        orderIndex: 2,
        type: 'explanation',
        contentEn: 'Like a path through a forest, Buddhism guides us step by step toward wisdom, compassion, and freedom from suffering.',
        contentSi: 'වනයක් හරහා මාර්ගයක් මෙන්, බෞද්ධාගම අපව පියවරෙන් පියවර ප්‍රඥාව, කරුණාව සහ දුක්ඛයෙන් නිදහසට මඟ පෙන්වයි.',
        imageUrl: null,
      },
      {
        lessonId: lesson1.id,
        orderIndex: 3,
        type: 'summary',
        contentEn: 'This path is open to everyone, regardless of background. It is about practice, not just belief.',
        contentSi: 'මෙම මාර්ගය සියලු දෙනාටම විවෘතයි, පසුබිම නොසලකා. එය විශ්වාසය පමණක් නොව පිළිපැදීම පිළිබඳවයි.',
        imageUrl: null,
      },
    ],
  });

  console.log('✅ Created slides (template for lesson 1 - add more through admin panel)');

  // Create Questions for Lesson 1 (Buddhism as a path) - Template
  console.log('Creating questions...');
  await prisma.question.createMany({
    data: [
      {
        lessonId: lesson1.id,
        orderIndex: 1,
        type: 'single_choice',
        promptEn: 'Buddhism is best described as…',
        promptSi: 'බෞද්ධාගම හොඳින් විස්තර කළ හැක්කේ…',
        configJson: {
          options: [
            { id: 'a', textEn: 'A set of beliefs', textSi: 'විශ්වාස කට්ටලයක්' },
            { id: 'b', textEn: 'A practical path to understanding and peace', textSi: 'අවබෝධයට සහ සාමයට ප්‍රායෝගික මාර්ගයක්' },
            { id: 'c', textEn: 'A collection of rituals', textSi: 'චාරිත්‍ර එකතුවක්' },
            { id: 'd', textEn: 'A historical tradition', textSi: 'ඓතිහාසික සම්ප්‍රදායක්' },
          ],
          correctAnswer: 'b',
        },
      },
      {
        lessonId: lesson1.id,
        orderIndex: 2,
        type: 'true_false',
        promptEn: 'Buddhism is primarily about practice, not just belief.',
        promptSi: 'බෞද්ධාගම ප්‍රධාන වශයෙන් පිළිපැදීම පිළිබඳවයි, විශ්වාසය පමණක් නොවේ.',
        configJson: {
          correctAnswer: true,
        },
      },
    ],
  });

  console.log('✅ Created questions (template for lesson 1 - add more through admin panel)');

  // Create Cards
  console.log('Creating cards...');
  const card1 = await prisma.card.create({
    data: {
      nameEn: 'First Steps',
      nameSi: 'පළමු පියවර',
      descriptionEn: 'Complete your first lesson',
      descriptionSi: 'ඔබේ පළමු පාඩම සම්පූර්ණ කරන්න',
      rarity: 'common',
      category: 'completion',
      imageUrl: 'https://example.com/cards/first-steps.png',
      unlockCondition: {
        type: 'first_lesson',
      },
    },
  });

  const card2 = await prisma.card.create({
    data: {
      nameEn: 'Dedicated Learner',
      nameSi: 'උත්සාහවත් ශිෂ්‍යයා',
      descriptionEn: 'Maintain a 7-day streak',
      descriptionSi: 'දින 7 ක අඛණ්ඩතාවක් පවත්වා ගන්න',
      rarity: 'rare',
      category: 'streak',
      imageUrl: 'https://example.com/cards/dedicated-learner.png',
      unlockCondition: {
        type: 'streak',
        days: 7,
      },
    },
  });

  const card3 = await prisma.card.create({
    data: {
      nameEn: 'Perfect Student',
      nameSi: 'පරිපූර්ණ ශිෂ්‍යයා',
      descriptionEn: 'Get a perfect score on any quiz',
      descriptionSi: 'ඕනෑම ප්‍රශ්න පත්‍රයක 100% ලකුණු ලබන්න',
      rarity: 'epic',
      category: 'perfect',
      imageUrl: 'https://example.com/cards/perfect-student.png',
      unlockCondition: {
        type: 'perfect_quiz',
      },
    },
  });

  const card4 = await prisma.card.create({
    data: {
      nameEn: 'Chapter Master',
      nameSi: 'පරිච්ඡේද මාස්ටර්',
      descriptionEn: 'Complete all lessons in a chapter',
      descriptionSi: 'පරිච්ඡේදයක සියලුම පාඩම් සම්පූර්ණ කරන්න',
      rarity: 'rare',
      category: 'completion',
      imageUrl: 'https://example.com/cards/chapter-master.png',
      unlockCondition: {
        type: 'chapter_complete',
        chapterId: chapter1.id, // Will check dynamically
      },
    },
  });

  const card5 = await prisma.card.create({
    data: {
      nameEn: 'XP Champion',
      nameSi: 'XP ශූරයා',
      descriptionEn: 'Reach 1000 XP',
      descriptionSi: 'XP 1000 ක් ළඟා කරන්න',
      rarity: 'epic',
      category: 'xp',
      imageUrl: 'https://example.com/cards/xp-champion.png',
      unlockCondition: {
        type: 'xp_threshold',
        xp: 1000,
      },
    },
  });

  const card6 = await prisma.card.create({
    data: {
      nameEn: 'Monthly Master',
      nameSi: 'මාසික මාස්ටර්',
      descriptionEn: 'Maintain a 30-day streak',
      descriptionSi: 'දින 30 ක අඛණ්ඩතාවක් පවත්වා ගන්න',
      rarity: 'legendary',
      category: 'streak',
      imageUrl: 'https://example.com/cards/monthly-master.png',
      unlockCondition: {
        type: 'streak',
        days: 30,
      },
    },
  });

  // Add Buddha Bodhi card (from example)
  const card7 = await prisma.card.create({
    data: {
      nameEn: 'Buddha Bodhi',
      nameSi: 'බුද්ධ බෝධි',
      descriptionEn: 'Complete the "Who is the Buddha?" lesson',
      descriptionSi: '"බුදුරජාණන් වහන්සේ කවුද?" පාඩම සම්පූර්ණ කරන්න',
      rarity: 'rare',
      category: 'completion',
      imageUrl: 'https://example.com/cards/buddha_bodhi_card.png',
      unlockCondition: {
        type: 'perfect_quiz',
        lessonId: lesson1.id, // Unlocks when lesson 1 is completed with perfect score
      },
    },
  });

  console.log('✅ Created 7 cards');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Users: 1`);
  console.log(`  - Worlds: 14`);
  console.log(`  - Chapters: 15`);
  console.log(`  - Lessons: 5`);
  console.log(`  - Slides: 8`);
  console.log(`  - Questions: 6`);
  console.log(`  - Cards: 6`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
