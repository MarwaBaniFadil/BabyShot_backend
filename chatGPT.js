const request = require('request');

function chatGPT(req, res) {
    // استخراج الـ disease و vaccine من الـ request
    const { disease, vaccine } = req.body; // المفروض تجيبهم من مكان ما

    // تكوين السؤال بناءً على المرض واللقاح
    const question = `ما هي الآثار الجانبية للطعم ${vaccine} وما هي الآثار الجانبية الإضافية للطعم مع المرض ${disease}- جاوبني باختصار بنقاط واضحة ?`;

    // تحديد الـ request body مع الـ content الجديد
    const requestBody = [
        {
            "content": "Hello! I'm an AI assistant bot based on ChatGPT 3. How may I help you?",
            "role": "system"
        },
        {
            "content": question,  // هنا يتم وضع السؤال الديناميكي
            "role": "user"
        }
    ];

    const options = {
        method: 'POST',
        url: 'https://chatgpt-api8.p.rapidapi.com/',
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': '2049f5dda8msh6d2815846a751b3p1e6468jsnebc580dad295',
            'X-RapidAPI-Host': 'chatgpt-api8.p.rapidapi.com'
        },
        body: requestBody,
        json: true
    };

    request(options, (error, response, body) => {
        if (error) {
            console.error('Error sending request:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(body);
        }
    });
}
const predefinedQA = [
    { question: "ما هي التطعيمات الاساسية للأطفال؟", answer: "التطعيمات الأساسية تشمل لقاح الحصبة، شلل الأطفال، الجدري المائي، والتهاب الكبد B." },
    { question: "متى يجب ان يحصل الطفل على تطعيم شلل الأطفال؟", answer: "يجب أن يحصل الطفل على تطعيم شلل الأطفال في عمر شهرين، 4 أشهر، 6 أشهر، وعند عمر 4-6 سنوات." },
    { question: "هل يمكن تأجيل التطعيم اذا كان الطفل مريض؟", answer: "يمكن تأجيل التطعيم إذا كان الطفل يعاني من حمى شديدة أو مرض حاد، ولكن في حالات الأمراض الخفيفة مثل الزكام، يمكن إعطاء التطعيم." },
    { question: "هل التطعيمات لها اثار جانبية؟", answer: "نعم، قد تحدث آثار جانبية خفيفة مثل الحمى أو احمرار مكان الحقن، وهي عادةً مؤقتة وتختفي بسرعة." },
    { question: "كيف يمكنني تتبع جدول تطعيمات طفلي؟", answer: " يمكنك استخدام التطبيق والدخول لصفحة سجل اطفالك ، وسنقوم بإرسال تذكيرات تلقائية بموعد كل تطعيم مقترح." },
    { question: "هل يمكنني تعديل مواعيد الطعومات؟", answer: "نعم، يمكنك تعديل المواعيد من خلال قسم المواعيد في التطبيق." },
    { question: "ما هي الفحوصات الدورية التي يحتاجها الطفل؟", answer: "تشمل الفحوصات الدورية قياس الوزن والطول، التحقق من صحة الأسنان، وفحص تطور المهارات الحركية والحسية." },
    { question: "كيف أحافظ على صحة طفلي خلال فصل الشتاء؟", answer: "احرص على تطعيم الطفل ضد الإنفلونزا، وقدم له أطعمة غنية بالفيتامينات، وتأكد من إبقائه دافئًا." },
    { question: "ما هي الأطعمة المفيدة لنمو الأطفال؟", answer: "الأطعمة الغنية بالبروتين، الكالسيوم، والفيتامينات مثل الحليب، البيض، الفواكه، والخضروات." },
    { question: "متى يجب أن أبدأ بإطعام طفلي طعاماً صلباً؟", answer: "يمكنك البدء بإطعام الطفل طعامًا صلبًا عند عمر 6 أشهر مع الاستمرار في الرضاعة." },
    { question: "ما هي النصائح لتحسين نوم الأطفال؟", answer: "اجعل وقت النوم روتينيًا وثابتًا، وابتعد عن الشاشات قبل النوم، وامنح الطفل حمامًا دافئًا." },
    { question: "كيف أتعامل مع ارتفاع حرارة طفلي؟", answer: "استخدم كمادات باردة وتأكد من إبقاء الطفل رطبًا. إذا استمرت الحرارة أكثر من يومين، استشر الطبيب." },
    // { question: "هل يمكنني تطعيم طفلي في المنزل؟", answer: "التطعيمات تتطلب بيئة طبية معقمة، لذا يفضل زيارة العيادة لضمان السلامة." },
    // { question: "ما هي أفضل طريقة لحماية الطفل من الأمراض المعدية؟", answer: "احرص على غسل اليدين بانتظام، تجنب الأماكن المزدحمة أثناء موسم الأمراض، واستكمل جدول التطعيمات." }
];

function chatbot(req, res) {
    const { question } = req.body;
    const newquestion = `اعطيني جواب يتكون من 50 كلمة او اقل للسؤال التالي : ${question}`;


    // التحقق إذا كان السؤال موجودًا في القائمة المحددة مسبقًا
    const predefinedAnswer = predefinedQA.find(q => q.question === question);

    if (predefinedAnswer) {
        // إذا كان السؤال موجودًا، أعد الجواب مباشرة
        res.json({ text: predefinedAnswer.answer });
    } else {
        // تكوين السؤال الديناميكي
        const requestBody = [
            {
                "content": "Hello! I'm an AI assistant bot based on ChatGPT 3. How may I help you?",
                "role": "system"
            },
            {
                "content": newquestion, // السؤال الديناميكي
                "role": "user"
            }
        ];

        const options = {
            method: 'POST',
            url: 'https://chatgpt-api8.p.rapidapi.com/',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': '35af4fc983msh02a0a91e6d67ed9p1e5114jsnbf7e0a62780a',
                'X-RapidAPI-Host': 'chatgpt-api8.p.rapidapi.com'
            },
            body: requestBody,
            json: true
        };

        // إرسال الطلب إلى API وإرجاع الجواب
        request(options, (error, response, body) => {
            if (error) {
                console.error('Error sending request:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.json(body);
            }
        });
    }
}
module.exports = { chatGPT ,chatbot};
