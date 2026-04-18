import { Router } from "express";
import OpenAI from "openai";
import { requireAdmin } from "../../middleware/requireAdmin.js";

const router = Router();
router.use(requireAdmin);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Bạn là chuyên gia SEO content writer chuyên về streetwear và thời trang local brand Việt Nam. Bạn viết cho "From the Stress" — một local brand tối giản tại TP.HCM.

Brand voice: bình tĩnh, chân thật, hơi thơ, không sales-y. Target: Gen Z & Millennials TPHCM, 18–28 tuổi, sống tối giản, quan tâm comfort và style cá nhân.

RULES bắt buộc:
- Viết hoàn toàn bằng tiếng Việt, tự nhiên như người thật
- Không dùng: "tuyệt vời", "hoàn hảo", "đặc biệt" — quá sáo rỗng
- Không nhồi keyword — nếu gượng thì bỏ
- Không bắt đầu intro bằng "Bạn có biết...", "Trong thời đại..."
- Tone: gần gũi như người bạn recommend outfit, không phải nhân viên bán hàng
- Output phải là JSON hợp lệ

OUTPUT FORMAT là JSON với cấu trúc:
{
  "seoTitle": "H1 title — keyword ở đầu, 60-70 ký tự",
  "metaDescription": "150-160 ký tự, có keyword, kết thúc soft CTA",
  "slug": "url-slug-ngan-co-keyword",
  "focusKeyword": "keyword chính",
  "secondaryKeywords": ["keyword phụ 1", "keyword phụ 2", "keyword phụ 3"],
  "featuredImageAlt": "alt text chứa keyword",
  "content": "Toàn bộ nội dung HTML bài viết — dùng thẻ HTML thuần (<h1>, <h2>, <h3>, <p>, <strong>, <ul>, <li>, <blockquote>). KHÔNG dùng Markdown.",
  "wordCount": 1000,
  "keywordDensity": "1.5%",
  "internalLinksCount": 2
}

Cấu trúc content HTML bắt buộc:
- <h1>: lặp lại SEO title
- Intro: 100-150 từ, chèn focus keyword trong 100 từ đầu, mở bằng pain point/scenario cụ thể
- Ít nhất 3 <h2> section, mỗi section 200-350 từ
- Mỗi section có [IMAGE: mô tả ảnh] dạng comment HTML <!-- IMAGE: mô tả -->
- 1-2 <strong> keyword quan trọng mỗi section
- <blockquote> cho highlight box key takeaway
- FAQ section cuối với ít nhất 3 câu hỏi dạng <strong>câu hỏi</strong> + <p>trả lời 40-60 từ</p>
- Kết bằng CTA nhẹ nhàng dẫn về product`;

// POST /admin/ai-writer/generate
router.post("/generate", async (req, res) => {
  try {
    const {
      keyword,
      searchIntent,
      targetReader,
      productToLink,
      relatedBlogs,
      wordCountTarget,
      specialNotes,
    } = req.body;

    if (!keyword) {
      return res.status(400).json({ message: "Keyword là bắt buộc" });
    }

    const wordCount = Number(wordCountTarget) || 1000;

    const relatedBlogsText = Array.isArray(relatedBlogs)
      ? relatedBlogs.filter((b) => b.anchor && b.path).map((b) => `"${b.anchor}" | ${b.path}`).join("\n")
      : "";

    const userPrompt = `Viết bài blog SEO cho website "From the Stress":

FOCUS_KEYWORD: ${keyword}
SEARCH_INTENT: ${searchIntent || "informational"}
TARGET_READER: ${targetReader || "Gen Z TPHCM, 18-25 tuổi, thích mặc thoải mái"}
PRODUCT_TO_LINK: ${productToLink || "/collections/all"}
RELATED_BLOGS (dùng làm internal links):
${relatedBlogsText || "Không có"}
WORD_COUNT_TARGET: ${wordCount} từ
SPECIAL_NOTES: ${specialNotes || "Không có"}

Mỗi internal link trong content dùng dạng: <a href="/đường-dẫn">anchor text</a>
CTA cuối bài dùng dạng: <a href="${productToLink || "/collections/all"}">xem sản phẩm</a>`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2500,
      frequency_penalty: 0.3,
      presence_penalty: 0.2,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Empty AI response");

    const result = JSON.parse(text);
    res.json(result);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ message: "AI trả về dữ liệu không hợp lệ, thử lại" });
    }
    res.status(500).json({ message: err.message });
  }
});

export default router;
