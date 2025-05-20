# FeelWell

تطبيق FeelWell هو منصة رعاية صحية متكاملة تتيح للمستخدمين الاستفادة من خدمات الاستشارات الطبية عن بعد والمساعد الصحي الذكي.

## المميزات

- تسجيل حساب للمرضى والأطباء
- لوحة تحكم المريض
- لوحة تحكم الطبيب
- مساعد صحي ذكي مدعوم بالذكاء الاصطناعي
- نظام المراسلة بين الطبيب والمريض
- جدولة المواعيد

## تقنيات المشروع

- **واجهة المستخدم**: React.js, Bootstrap
- **الخادم**: Node.js, Express
- **قاعدة البيانات**: MongoDB
- **المصادقة**: JSON Web Tokens (JWT)
- **الذكاء الاصطناعي**: OpenAI API

## متطلبات التشغيل

- Node.js (الإصدار 16 أو أعلى)
- MongoDB
- مفتاح API من OpenAI (للمساعد الصحي الذكي)

## طريقة التثبيت

1. استنساخ المشروع:
   ```
   git clone https://github.com/BasharALbadi/feelwell.git
   cd feelwell
   ```

2. تثبيت الاعتماديات:
   ```
   npm run install-all
   ```

3. إعداد ملف البيئة في مجلد server:
   ```
   cd server
   touch .env
   ```
   
   وإضافة المتغيرات التالية:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/feelwell
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   CLIENT_URL=http://localhost:3000
   OPENAI_API_KEY=your_openai_api_key
   ```

4. تشغيل التطبيق في وضع التطوير:
   ```
   cd ..
   npm run dev
   ```

## تشغيل في بيئة الإنتاج

- **الباكند**: `npm start`
- **الفرونت إند**: `npm run build`

## النشر على منصة Render

يمكن نشر هذا التطبيق بسهولة على منصة Render باستخدام ملف `render.yaml` المرفق.
