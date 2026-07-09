import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Math Tutor endpoint
app.post("/api/tutor", async (req, res) => {
  try {
    const { messages, userProfile } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: userProfile?.language === "ru" ? "Неверный список сообщений." : "Кабарлардын тизмеси туура эмес берилди." });
    }

    const isRu = userProfile?.language === "ru";
    let systemInstruction = "";

    if (isRu) {
      systemInstruction = `Ты — виртуальный учитель математики, который объясняет математику ученикам 5 класса на интересном и простом языке. Тебя зовут "Айпери".
Твоя цель — помочь ученику самостоятельно понять математические понятия (дроби, десятичные дроби, натуральные числа, уравнения, площадь и объем).
При общении строго соблюдай следующие правила:
1. Говори только на русском языке, в очень мягком, теплом, поддерживающем и понятном тоне.
2. Никогда не давай прямой готовый ответ сразу! Направляй ученика думать самостоятельно, задавай наводящие вопросы, веди его шаг за шагом.
3. В примерах используй кыргызский национальный колорит, повседневную жизнь (например: боорсоки, курут, яблоки, овечки/ягнята, юрта, горы, Иссык-Куль).
4. Если ученик ответил неверно, не ругай его, а поддержи: "Молодец, отличная попытка! Но давай подумаем вместе еще раз..."
5. При необходимости дай ученику интересную математическую загадку или небольшое интерактивное задание.
6. Имя ученика: ${userProfile?.name || "ученик"}, уровень: ${userProfile?.level || 1} XP. Обращайся к ученику по имени.`;
    } else {
      systemInstruction = `Сен 5-класстын окуучуларына математиканы кызыктуу жана жөнөкөй тил менен түшүндүргөн виртуалдык мугалимсиң. Сенин атың - "Айпери". 
Сенин максатың - окуучуга математикалык түшүнүктөрдү (бөлчөктөр, ондук бөлчөктөр, натуралдык сандар, теңдемелер, аянт жана көлөм) өз алдынча түшүнүүгө жардам берүү.
Сүйлөшүүдө төмөнкү эрежелерди так сакта:
1. Кыргыз тилинде гана, өтө жумшак, жылуу, колдоо көрсөткөн жана түшүнүктүү тилде сүйлө.
2. Эч качан түз жообун дароо айтпа! Окуучуну өз алдынча ойлонууга багытта, суроолорду бер, кадам-кадам менен жетеле.
3. Мисалдарда кыргыздын улуттук колоритин, күнүмдүк жашоону колдон (мисалы: боорсок, курут, алма, кой-козу, боз үй, тоолор).
4. Окуучу туура эмес жооп берсе, урушпай, "Азаматсың, аракет кылдың! Бирок дагы бир жолу ойлонуп көрөлүчү..." деп колдоо көрсөт.
5. Зарыл болсо, окуучуга кызыктуу математикалык табышмак же кыскача тапшырма бер.
6. Окуучунун аты: ${userProfile?.name || "окуучу"}, деңгээли: ${userProfile?.level || 1} XP. Окуучуга атынан кайрыл.`;
    }

    // Convert client-side chat message history to Gemini API chat history format
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const defaultReply = isRu 
      ? "Извини, произошла ошибка подключения. Пожалуйста, задай вопрос еще раз." 
      : "Кечиресиң, байланышта ката кетти. Суроону дагы бир жолу берип көрчү.";
    const replyText = response.text || defaultReply;
    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Ички сервер катасы: " + (error.message || error) });
  }
});

// Endpoint for generating a dynamic math exercise or hint
app.post("/api/tutor/exercise", async (req, res) => {
  try {
    const { topic, difficulty, language } = req.body;
    const isRu = language === "ru";
    
    let prompt = "";
    if (isRu) {
      prompt = `Напиши мне одну интересную математическую задачу (текстовую задачу или пример) по теме "${topic || "Обыкновенные дроби"}" средней сложности (${difficulty || "средняя"}), подходящую для ученика 5 класса. В ней должен быть правильный ответ.
Верни в следующем формате JSON:
{
  "question": "Текст задачи на русском языке...",
  "options": ["вариант А", "вариант Б", "вариант В", "вариант Г"],
  "correctAnswer": "текст правильного варианта (должен в точности совпадать с одним из вариантов из массива options)",
  "explanation": "Пошаговое объяснение решения на русском языке..."
}
Верни только чистый JSON без каких-либо дополнительных слов или разметки \`\`\`json.`;
    } else {
      prompt = `Мага 5-класстын окуучусуна ылайыкталган "${topic || "Жөнөкөй бөлчөктөр"}" темасы боюнча ${difficulty || "орто"} татаалдыктагы бир математикалык маселе (текстүү маселе же мисал) жазып бер. Жообу дагы болушу керек. 
Төмөнкү JSON форматында кайтар:
{
  "question": "Маселенин тексти кыргыз тилинде...",
  "options": ["вариант А", "вариант Б", "вариант В", "вариант Г"],
  "correctAnswer": "туура варианттын тексти (options массивинен)",
  "explanation": "Кадам-кадам менен чыгарылышынын түшүндүрмөсү кыргыз тилинде..."
}
Тек гана таза JSON кайтар, эч кандай кошумча текстсиз же \`\`\`json белгисиз.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    try {
      const exercise = JSON.parse(resultText.trim());
      res.json(exercise);
    } catch (parseErr) {
      console.error("Failed to parse JSON from AI response:", resultText);
      res.status(500).json({ error: isRu ? "Ошибка: задача создана в неверном формате." : "Ката: маселе туура эмес форматта түзүлдү." });
    }
  } catch (error: any) {
    console.error("Gemini API exercise generation error:", error);
    res.status(500).json({ error: "Ички сервер катасы: " + (error.message || error) });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist/ in production.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
