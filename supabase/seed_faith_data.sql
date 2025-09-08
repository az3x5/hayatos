-- Sample Faith Knowledge Base Data
-- This file contains sample Quran verses, Hadith, and Duas for development

-- Insert sample Quran verses (Al-Fatiha and first few verses of Al-Baqarah)
INSERT INTO public.quran (surah_number, surah_name_arabic, surah_name_english, surah_name_transliteration, ayah_number, ayah_text_arabic, ayah_text_english, ayah_text_transliteration, revelation_type, juz_number, hizb_number, rub_number) VALUES
(1, 'الفاتحة', 'The Opening', 'Al-Fatiha', 1, 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', 'Bismillahi r-rahmani r-raheem', 'meccan', 1, 1, 1),
(1, 'الفاتحة', 'The Opening', 'Al-Fatiha', 2, 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', '[All] praise is [due] to Allah, Lord of the worlds -', 'Alhamdu lillahi rabbi l-alameen', 'meccan', 1, 1, 1),
(1, 'الفاتحة', 'The Opening', 'Al-Fatiha', 3, 'الرَّحْمَٰنِ الرَّحِيمِ', 'The Entirely Merciful, the Especially Merciful,', 'Ar-rahmani r-raheem', 'meccan', 1, 1, 1),
(1, 'الفاتحة', 'The Opening', 'Al-Fatiha', 4, 'مَالِكِ يَوْمِ الدِّينِ', 'Sovereign of the Day of Recompense.', 'Maliki yawmi d-deen', 'meccan', 1, 1, 1),
(1, 'الفاتحة', 'The Opening', 'Al-Fatiha', 5, 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'It is You we worship and You we ask for help.', 'Iyyaka na''budu wa iyyaka nasta''een', 'meccan', 1, 1, 1),
(1, 'الفاتحة', 'The Opening', 'Al-Fatiha', 6, 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'Guide us to the straight path -', 'Ihdina s-sirata l-mustaqeem', 'meccan', 1, 1, 1),
(1, 'الفاتحة', 'The Opening', 'Al-Fatiha', 7, 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.', 'Sirata l-ladhina an''amta ''alayhim ghayri l-maghdubi ''alayhim wa la d-dalleen', 'meccan', 1, 1, 1),

(2, 'البقرة', 'The Cow', 'Al-Baqarah', 1, 'الم', 'Alif, Lam, Meem.', 'Alif Lam Meem', 'medinan', 1, 1, 2),
(2, 'البقرة', 'The Cow', 'Al-Baqarah', 2, 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ', 'This is the Book about which there is no doubt, a guidance for those conscious of Allah -', 'Dhalika l-kitabu la rayba feeh hudan li-l-muttaqeen', 'medinan', 1, 1, 2),
(2, 'البقرة', 'The Cow', 'Al-Baqarah', 3, 'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ', 'Who believe in the unseen, establish prayer, and spend out of what We have provided for them,', 'Alladheena yu''minoona bi-l-ghaybi wa yuqeemoona s-salata wa mimma razaqnahum yunfiqoon', 'medinan', 1, 1, 2),
(2, 'البقرة', 'The Cow', 'Al-Baqarah', 4, 'وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ', 'And who believe in what has been revealed to you, [O Muhammad], and what was revealed before you, and of the Hereafter they are certain [in faith].', 'Wa-lladheena yu''minoona bima unzila ilayka wa ma unzila min qablika wa bi-l-akhirati hum yooqinoon', 'medinan', 1, 1, 2),
(2, 'البقرة', 'The Cow', 'Al-Baqarah', 5, 'أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ', 'Those are upon [right] guidance from their Lord, and it is those who are the successful.', 'Ula''ika ''ala hudan min rabbihim wa ula''ika humu l-muflihoon', 'medinan', 1, 1, 2);

-- Insert sample Hadith from various collections
INSERT INTO public.hadith (collection, book_number, book_name, hadith_number, chapter, hadith_text_arabic, hadith_text_english, narrator, grade, reference) VALUES
('bukhari', 1, 'Revelation', '1', 'How the Divine Inspiration started', 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', 'The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.', 'Umar ibn al-Khattab', 'sahih', 'Sahih al-Bukhari 1'),
('bukhari', 2, 'Belief', '8', 'The Statement of Allah', 'الإِسْلاَمُ أَنْ تَشْهَدَ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ', 'Islam is to testify that none has the right to be worshipped but Allah and Muhammad is Allah''s Messenger, to offer the prayers dutifully and perfectly, to pay the Zakat, to perform Hajj and to observe fast during the month of Ramadan.', 'Abdullah ibn Umar', 'sahih', 'Sahih al-Bukhari 8'),
('muslim', 1, 'Faith', '1', 'The Pillars of Islam and Faith', 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ', 'Islam has been built on five [pillars]: testifying that there is no deity worthy of worship except Allah and that Muhammad is the Messenger of Allah, establishing the salah (prayer), paying the zakat (obligatory charity), making the hajj (pilgrimage) to the House, and fasting in Ramadan.', 'Abdullah ibn Umar', 'sahih', 'Sahih Muslim 16'),
('tirmidhi', 1, 'Purification', '1', 'What has been related about the key to prayer being purification', 'مِفْتَاحُ الصَّلاَةِ الطُّهُورُ', 'The key to prayer is purification, its beginning is the takbir, and its end is the taslim.', 'Ali ibn Abi Talib', 'sahih', 'Jami at-Tirmidhi 3'),
('abudawud', 1, 'Purification', '61', 'Regarding the obligation of ablution', 'لاَ تُقْبَلُ صَلاَةٌ بِغَيْرِ طُهُورٍ', 'No prayer is accepted without purification.', 'Abdullah ibn Umar', 'sahih', 'Sunan Abi Dawud 61');

-- Insert sample Duas for various occasions
INSERT INTO public.duas (title, category, dua_arabic, dua_transliteration, dua_english, reference, benefits, occasion) VALUES
('Morning Remembrance', 'morning', 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', 'Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illa Allah wahdahu la sharika lah', 'We have reached the morning and at this very time unto Allah belongs all sovereignty. All praise is for Allah. None has the right to be worshipped except Allah, alone, without partner.', 'Muslim', 'Protection and blessings for the day', 'Every morning'),

('Evening Remembrance', 'evening', 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', 'Amsayna wa amsal-mulku lillah, walhamdu lillah, la ilaha illa Allah wahdahu la sharika lah', 'We have reached the evening and at this very time unto Allah belongs all sovereignty. All praise is for Allah. None has the right to be worshipped except Allah, alone, without partner.', 'Muslim', 'Protection and blessings for the night', 'Every evening'),

('Before Eating', 'eating', 'بِسْمِ اللَّهِ', 'Bismillah', 'In the name of Allah', 'Bukhari, Muslim', 'Blessing in food and protection from harm', 'Before every meal'),

('After Eating', 'eating', 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', 'Alhamdu lillahil-ladhi at''amani hadha wa razaqaneehi min ghayri hawlin minnee wa la quwwah', 'All praise is for Allah, Who fed me this and provided it for me without any might nor power from myself.', 'Abu Dawud, Tirmidhi', 'Gratitude and forgiveness of sins', 'After finishing a meal'),

('Before Sleep', 'sleep', 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', 'Bismika Allahumma amootu wa ahya', 'In Your name O Allah, I live and die', 'Bukhari', 'Protection during sleep', 'Before going to bed'),

('Upon Waking', 'sleep', 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', 'Alhamdu lillahil-ladhi ahyana ba''da ma amatana wa ilayhin-nushoor', 'All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.', 'Bukhari', 'Gratitude for being granted another day', 'Upon waking up'),

('Entering the Mosque', 'mosque', 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', 'Allahummaf-tah lee abwaba rahmatik', 'O Allah, open for me the doors of Your mercy', 'Muslim', 'Seeking Allah''s mercy and blessings', 'When entering a mosque'),

('Leaving the Mosque', 'mosque', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ وَرَحْمَتِكَ', 'Allahumma innee as''aluka min fadlika wa rahmatik', 'O Allah, I ask You from Your favor and mercy', 'Muslim', 'Seeking Allah''s favor and mercy', 'When leaving a mosque'),

('For Forgiveness', 'repentance', 'رَبِّ اغْفِرْ لِي ذَنْبِي وَخَطَئِي وَجَهْلِي', 'Rabbighfir lee dhanbee wa khata''ee wa jahlee', 'My Lord, forgive me my sin, my error, and my ignorance', 'Bukhari, Muslim', 'Forgiveness of sins and purification', 'Anytime seeking forgiveness'),

('For Guidance', 'guidance', 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ', 'Allahummahdini feeman hadayt', 'O Allah, guide me among those You have guided', 'Abu Dawud, Tirmidhi', 'Seeking right guidance', 'During times of confusion or decision-making'),

('For Protection', 'protection', 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', 'A''oodhu bikalimatil-lahit-tammati min sharri ma khalaq', 'I seek refuge in the perfect words of Allah from the evil of what He has created', 'Muslim', 'Protection from all forms of harm', 'When seeking protection'),

('For Travel', 'travel', 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', 'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrineen', 'Exalted is He who has subjected this to us, and we could not have [otherwise] subdued it', 'Abu Dawud, Tirmidhi', 'Safe and blessed journey', 'When beginning a journey'),

('For Rain', 'weather', 'اللَّهُمَّ اسْقِنَا غَيْثًا مُغِيثًا مَرِيئًا نَافِعًا غَيْرَ ضَارٍّ', 'Allahumas-qina ghaythan mugheethan maree''an nafi''an ghayra darr', 'O Allah, shower upon us abundant rain, beneficial and not harmful', 'Abu Dawud', 'Beneficial rain and relief from drought', 'During times of drought or need for rain'),

('For Knowledge', 'learning', 'رَبِّ زِدْنِي عِلْمًا', 'Rabbi zidnee ''ilma', 'My Lord, increase me in knowledge', 'Quran 20:114', 'Increase in beneficial knowledge', 'When seeking knowledge or before studying'),

('For Health', 'health', 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي', 'Allahumma ''afinee fee badanee, Allahumma ''afinee fee sam''ee, Allahumma ''afinee fee basaree', 'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight', 'Abu Dawud', 'Good health and protection from illness', 'When seeking good health');

-- Note: In a real implementation, you would import complete datasets
-- This is just a sample to demonstrate the structure
