import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import express from "express";

// === Cấu hình ===
const TOKEN = "TOKEN-BOT-CỦA-BẠN"; // ⚠️ Thay bằng token thật (không chia sẻ công khai)
const CHANNEL_ID = "1432358007471210549"; // ID kênh Discord muốn gửi code

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
    console.error("⚠️ Lỗi khi lấy code:", err.message);
    return new Set();
  }
}

// === Hàm kiểm tra & gửi code ===
async function checkCodes() {
  const newCodes = await getLatestCodes();
  const diff = [...newCodes].filter((x) => !lastCodes.has(x));

  if (diff.length > 0) {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) {
      await channel.send(`🎁 **Code Honkai Star Rail mới!**\n${diff.join("\n")}`);
      console.log("✅ Gửi code mới:", diff);
    }
    lastCodes = newCodes;
  } else {
    console.log("⏳ Không có code mới.");
  }
}

// === Khi bot sẵn sàng ===
client.once("ready", async () => {
  console.log(`🤖 Bot đã đăng nhập: ${client.user.tag}`);

  // Kiểm tra ngay khi khởi động
  await checkCodes();

  // Lặp lại mỗi 30 phút
  cron.schedule("*/30 * * * *", checkCodes);
});

// === Giữ bot hoạt động 24/24 (bắt buộc cho Render) ===
const app = express();
app.get("/", (req, res) => {
  res.send("✅ Bot Honkai Star Rail đang hoạt động 24/24!");
});
app.listen(3000, () => console.log("🌐 Server đang chạy tại cổng 3000"));

// === Chạy bot ===
client.login(TOKEN);
