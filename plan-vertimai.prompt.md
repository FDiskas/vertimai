## Plan: Vertimų Redaktoriaus MVP + AI

Sukuriamas client-side vertimų redaktorius su Vite + React + TypeScript + Tailwind + shadcn/ui, naudojant Zustand būsenai, IndexedDB duomenų saugojimui (su localStorage tik UI nustatymams), JSON import/export, split-view redagavimą ir per-langelį AI vertimą su vartotojo OPENAI_API_KEY iš Settings (password tipo laukas, raktas saugomas tik lokaliai naršyklėje).

**Steps**
1. Fazė A - Projekto pamatas. Inicializuoti Vite React TypeScript projektą, sukonfigūruoti Tailwind ir shadcn/ui bazinius komponentus, prijungti Inter šriftą, sukurti pagrindinį layout: kairė sidebar navigacijai tarp kalbų/failų ir centrinė redagavimo zona.
2. Fazė A - Būsenos ir persistencijos architektūra. Įdiegti Zustand store su aiškia schema: translations, languages, selectedFile, filters, splitView, settings. Persistencijai naudoti IndexedDB duomenims (vertimų turiniui) ir localStorage tik lengviems nustatymams (pvz. paskutinė UI būsena, OPENAI_API_KEY pagal jūsų reikalavimą).
3. Fazė B - Failų apdorojimas. Įgyvendinti drag-and-drop upload zoną ir failo importo pipeline: JSON validacija, parse, normalizavimas į vidinį modelį { key: { lang: value } }, saugojimas į IndexedDB, klaidų pranešimai neteisingam formatui.
4. Fazė B - Vertimų redaktorius. Sukurti shadcn/ui pagrindu lentelės/grid komponentą su stulpeliais: key, originali reikšmė, tikslinių kalbų įvestys, AI mygtukas prie kiekvieno redaguojamo lauko. Įtraukti addNewTranslationKey, kuris prideda naują raktą visoms kalboms vienu metu.
5. Fazė C - Įrankių juosta ir produktyvumas. Pridėti paiešką, filtrą tik neišversti, Add New Key, Export mygtukus, taip pat kalbų completion badge indikatorių (procentais) ir split view (dviejų pasirinktų kalbų palyginimas greta).
6. Fazė C - OpenAI integracija. Sukurti useOpenAITranslate hook: priima tekstą ir target kalbą, tvarko loading/error būsenas, kviečiamas iš AI mygtuko prie konkretaus lauko. Settings dialoge pateikti OPENAI_API_KEY įvedimą (input type=password), laikyti tik lokaliai naršyklėje ir niekada nehardcodinti kode.
7. Fazė D - Eksportas. Įgyvendinti transformaciją iš vidinės store struktūros atgal į pradinį JSON formatą ir failo atsisiuntimą per Blob + temporary anchor.
8. Fazė D - Dizaino poliravimas. Užtikrinti modernų, švarų UI su aiškia vizualine hierarchija: whitespace, švelnūs šešėliai, nuosekli tipografija, mobilus prisitaikymas (desktop + mobile), išlaikant esamą shadcn dizaino kalbą.
9. Fazė E - Verifikacija ir hardening. Atlikti funkcinius testus import/edit/export srautui, persistencijos testus po perkrovimo, AI klaidų scenarijus (neteisingas raktas, quota, network), didesnio JSON našumo patikrinimą ir patvirtinti, kad API raktas neatsiduria repozitorijoje ar eksporte.

**Relevant files**
- Tuščias workspace: pirmiausia bus kuriama nauja projekto struktūra (nėra esamų failų modifikavimui).
- /memories/session/plan.md - šio plano versija sekimui ir atnaujinimui.

**Verification**
1. Paleidimas ir UI: projektas startuoja be klaidų, matomas sidebar + grid + toolbar + settings.
2. Importas: validus JSON sėkmingai įkeliamas, neteisingas JSON pateikia aiškų klaidos pranešimą.
3. Redagavimas: pakeitimai lentelėje iškart atsispindi būsenoje ir išlieka po perkrovimo.
4. addNewTranslationKey: naujas raktas sukuriamas visoms aktyvioms kalboms be struktūros pažeidimo.
5. Split view: dvi kalbos rodomos greta ir galima palyginti bei redaguoti nepriklausomai.
6. AI mygtukas: vieno lauko vertimas veikia su loading/error būsenomis ir nekeičia kitų eilučių.
7. Saugumas: OPENAI_API_KEY nėra hardcodintas, settings laukas password tipo, raktas saugomas tik lokaliai.
8. Eksportas: parsisiųstas JSON atitinka originalią struktūrą { key: { lang: value } }.
9. Našumas: didesni failai stabiliai veikia dėl IndexedDB ir neblokuoja UI.

**Decisions**
- Pasirinkta Zustand vietoje Context API dėl mažesnio boilerplate ir patogesnio centralizuoto state valdymo.
- Pasirinktas IndexedDB nuo pirmos versijos (pagal jūsų atsakymą apie didesnius failus).
- OPENAI_API_KEY saugomas localStorage (pagal jūsų pageidavimą), su aiškiu perspėjimu apie client-side rizikas.
- Scope įtraukta: importas, redagavimas, split view, AI vertimas, eksportas, status indikatoriai.
- Scope neįtraukta: serverinė autentikacija, backend proxy, komandinis kelių vartotojų redagavimas.

**Further Considerations**
1. Jei vėliau norėsite sumažinti API rakto riziką, galima pereiti į sessionStorage arba memory-only režimą nekeičiant pagrindinės architektūros.
2. Jei AI kvietimai taps lėti masiniuose veiksmuose, galima pridėti batch queue su throttling tame pačiame useOpenAITranslate sluoksnyje.
3. Jei atsiras kelių failų projektai su namespace, galima praplėsti modelį pridėjus group/module lauką prie key įrašų.