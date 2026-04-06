import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "[ENCRYPTION_KEY]" });

export async function rewriteArticle({ title, content, source }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const prompt = `Bạn là một content writer chuyên về thời trang streetwear tại Việt Nam.

Dựa trên bài viết gốc bên dưới (tiếng Anh), hãy viết một bài blog HOÀN TOÀN MỚI bằng tiếng Việt với yêu cầu:

1. KHÔNG dịch nguyên văn - viết lại theo góc nhìn riêng, phong cách trẻ trung, gần gũi Gen Z Việt Nam
2. Độ dài: 400-600 từ
3. Format: HTML THUẦN (dùng thẻ <h2> cho tiêu đề chính, <h3> cho tiêu đề phụ, <p> cho đoạn văn, <strong> cho từ khóa quan trọng, <ul><li> cho danh sách)
4. KHÔNG dùng Markdown (không dùng ##, **, __ hay bất kỳ ký hiệu Markdown nào)
5. Thêm nhận xét, góc nhìn từ thị trường Việt Nam nếu phù hợp
6. Kết bài bằng 1-2 câu kêu gọi hành động (khám phá thêm tại FROM THE STRESS)

Trả về JSON với format:
{
  "title": "Tiêu đề bài viết tiếng Việt (hấp dẫn, SEO-friendly)",
  "excerpt": "Mô tả ngắn 1-2 câu (max 160 ký tự)",
  "content": "Nội dung bài viết HTML thuần, bắt đầu bằng thẻ <h2> hoặc <p>",
  "metaTitle": "SEO title (max 60 ký tự)",
  "metaDescription": "SEO description (max 160 ký tự)"
}

Ví dụ content hợp lệ:
"<h2>Streetwear Việt Nam đang lên ngôi</h2><p>Xu hướng này đang...</p><h3>Điều gì làm nên sự khác biệt?</h3><ul><li>Chất lượng vải</li><li>Thiết kế độc đáo</li></ul><p>Khám phá thêm tại <strong>FROM THE STRESS</strong>.</p>"

---
Bài viết gốc:
Title: ${title}
Content: ${content}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Empty AI response");

  return JSON.parse(text);
}
