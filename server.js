import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";

// === Cấu hình ===
const TOKEN = process.env.TOKEN; // ⚠️ Nhập TOKEN bot ở Environment Variables
const CHANNEL_ID = "1432358007471210549"; // ⚠️ Thay bằng ID kênh Discord của bạn

// === Khởi tạo bot ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

let lastCodes = new Set();

// === Hàm lấy code mới ===
async function getLatestCodes() {
  try {
    const url = "https://www.hoyolab.com/article_list/35/2";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const codes = new Set();
    $("a").each((i, el) => {
      const text = $(el).text();
      const found = text.match(/\b[A-Z0-9]{10,}\b/g);
      if (found) {
        for (const code of found) {
          if (code.length >= 10) codes.add(code);
        }
      }
    });

    return codes;
  } catch (err) {
    console.error("❌ Lỗi khi lấy code:", err.message);
    return new Set();
  }
}

// === Hàm kiểm tra & gửi code ===
async function checkCodes() {
  try {
    const newCodes = await getLatestCodes();
    const diff = [...newCodes].filter((x) => !lastCodes.has(x));
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (diff.length > 0) {
      await channel.send(`🎁 **Code Honkai Star Rail mới!**\n${diff.join("\n")}`);
      console.log("✅ Gửi code mới:", diff);
      lastCodes = newCodes;
    } else {
      const time = new Date().toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
      await channel.send(`⏳ Không có code mới (lúc ${time})`);
      console.log("⏳ Không có code mới:", time);
    }
  } catch (err) {
    console.error("❌ Lỗi checkCodes:", err.message);
  }
}

// === Khi bot sẵn sàng ===
client.once("ready", async () => {
  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
  await checkCodes(); // kiểm tra ngay khi khởi động
  cron.schedule("*/30 * * * *", checkCodes); // lặp lại mỗi 30 phút
});

// === Chạy bot ===
client.login(TOKEN);

// === Web server nhỏ để Render không tắt bot ===
const app = express();
app.get("/", (req, res) => res.send("✅ Bot đang chạy 24/24 trên Render!"));
app.listen(10000, () => console.log("🌐 Web server hoạt động (port 10000)"));
