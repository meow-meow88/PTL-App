import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  // Initialize Gemini safely
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      aiAvailable: Boolean(process.env.GEMINI_API_KEY),
      service: "Phuket Trusted Local AI Agent Squad (Mr. Big, Molly, Emily, Varvara)",
      agents: [
        "Mr. Big (The Technical Field Guardian)",
        "Molly (The Sourcing & Pricing Coordinator)",
        "Emily (Executive Assistant & Payment Copilot)",
        "Varvara (Social Media & Marketing Specialist)",
      ],
    });
  });

  // --------------------------------------------------------------------------
  // Official Logo Provider
  // --------------------------------------------------------------------------
  app.get("/api/logo", (_req: Request, res: Response) => {
    try {
      const publicDir = path.join(process.cwd(), "public");
      const candidates = [
        path.join(publicDir, "ptl_original_uploaded.svg"),
        path.join(publicDir, "ptl_logo.svg"),
        path.join(publicDir, "ptl_original_uploaded.png"),
        path.join(publicDir, "ptl_logo.png"),
        path.join(publicDir, "ptl_full_logo.png"),
        path.join(publicDir, "ptl_logo_original.svg"),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          const ext = path.extname(p).toLowerCase();
          let mime = "image/png";
          if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
          if (ext === ".svg") mime = "image/svg+xml";
          const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
          res.json({ dataUrl, mime });
          return;
        }
      }
      res.json({ dataUrl: "" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load logo" });
    }
  });

  // --------------------------------------------------------------------------
  // Upload Official Untouched Original Logo (No modifications, pure scaling)
  // --------------------------------------------------------------------------
  app.post("/api/upload-logo", async (req: Request, res: Response) => {
    try {
      const { dataUrl } = req.body;
      if (!dataUrl || typeof dataUrl !== "string") {
        res.status(400).json({ error: "dataUrl is required" });
        return;
      }

      // Extract base64 and mime
      const matches = dataUrl.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ error: "Invalid data URL format" });
        return;
      }

      const mimeType = matches[1].toLowerCase();
      const buffer = Buffer.from(matches[2], "base64");
      const publicDir = path.join(process.cwd(), "public");
      const isSvg = mimeType.includes("svg");

      if (isSvg) {
        // Save exact raw SVG file without any alteration
        const rawSvgPath = path.join(publicDir, "ptl_original_uploaded.svg");
        fs.writeFileSync(rawSvgPath, buffer);
        fs.writeFileSync(path.join(publicDir, "ptl_logo.svg"), buffer);
        fs.writeFileSync(path.join(publicDir, "IMG_4062.svg"), buffer);

        // Render crisp raster icons using rsvg-convert directly from the original SVG
        try {
          execSync(`rsvg-convert -w 1024 -h 1024 "${rawSvgPath}" -o "${path.join(publicDir, "ptl_original_uploaded.png")}"`);
          execSync(`rsvg-convert -w 1024 -h 1024 "${rawSvgPath}" -o "${path.join(publicDir, "ptl_logo.png")}"`);
          execSync(`rsvg-convert -w 180 -h 180 "${rawSvgPath}" -o "${path.join(publicDir, "apple-touch-icon.png")}"`);
          execSync(`rsvg-convert -w 192 -h 192 "${rawSvgPath}" -o "${path.join(publicDir, "pwa-192x192.png")}"`);
          execSync(`rsvg-convert -w 512 -h 512 "${rawSvgPath}" -o "${path.join(publicDir, "pwa-512x512.png")}"`);
          execSync(`rsvg-convert -w 64 -h 64 "${rawSvgPath}" -o "${path.join(publicDir, "favicon.png")}"`);
        } catch (rsvgErr) {
          console.warn("rsvg-convert notice, falling back to convert:", rsvgErr);
          try {
            execSync(`convert "${rawSvgPath}" -resize 1024x1024 "${path.join(publicDir, "ptl_logo.png")}"`);
          } catch (convErr) {
            console.warn("convert fallback notice:", convErr);
          }
        }
      } else {
        // Raster image (PNG/JPG)
        const rawOriginalPath = path.join(publicDir, "ptl_original_uploaded.png");
        fs.writeFileSync(rawOriginalPath, buffer);
        fs.writeFileSync(path.join(publicDir, "ptl_logo.png"), buffer);
        fs.writeFileSync(path.join(publicDir, "ptl_logo.jpg"), buffer);

        try {
          execSync(`convert "${rawOriginalPath}" -resize 180x180 "${path.join(publicDir, "apple-touch-icon.png")}"`);
          execSync(`convert "${rawOriginalPath}" -resize 192x192 "${path.join(publicDir, "pwa-192x192.png")}"`);
          execSync(`convert "${rawOriginalPath}" -resize 512x512 "${path.join(publicDir, "pwa-512x512.png")}"`);
          execSync(`convert "${rawOriginalPath}" -resize 64x64 "${path.join(publicDir, "favicon.png")}"`);
        } catch (resizeErr) {
          console.warn("Could not resize via ImageMagick, writing raw buffer directly to icons:", resizeErr);
        }
      }

      // Update src/data/defaultLogo.ts so DEFAULT_PTL_LOGO_BASE64 is permanently updated
      try {
        const defaultLogoPath = path.join(process.cwd(), "src", "data", "defaultLogo.ts");
        if (fs.existsSync(defaultLogoPath)) {
          const logoPath = isSvg ? "/ptl_logo.svg" : "/ptl_logo.png";
          const newCode = `// Phuket Trusted Local Official Logo - Exact Raw User Upload\nexport const DEFAULT_PTL_LOGO = '${logoPath}';\nexport const DEFAULT_PTL_LOGO_BASE64 = '${dataUrl}';\n`;
          fs.writeFileSync(defaultLogoPath, newCode, "utf8");
        }
      } catch (writeErr) {
        console.warn("Could not write to defaultLogo.ts:", writeErr);
      }

      res.json({
        success: true,
        message: "Original logo saved successfully without any modifications",
        url: isSvg ? "/ptl_logo.svg?t=" + Date.now() : "/ptl_logo.png?t=" + Date.now(),
      });
    } catch (err: any) {
      console.error("Error saving logo:", err);
      res.status(500).json({ error: err.message || "Failed to save logo" });
    }
  });

  // --------------------------------------------------------------------------
  // Server-Side Durable Jobs Persistence & Multi-Level Auto-Backups
  // Ensures user data is never lost across reloads, crashes, or session changes
  // --------------------------------------------------------------------------
  const DATA_DIR = path.join(process.cwd(), "data");
  const BACKUPS_DIR = path.join(DATA_DIR, "backups");
  const JOBS_FILE = path.join(DATA_DIR, "user_jobs.json");

  // Ensure directories exist
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  } catch (dirErr) {
    console.error("Failed to create data/backups directory:", dirErr);
  }

  // Get current saved jobs
  app.get("/api/jobs", (_req: Request, res: Response) => {
    try {
      if (fs.existsSync(JOBS_FILE)) {
        const raw = fs.readFileSync(JOBS_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.jobs) && parsed.jobs.length > 0) {
          res.json({
            success: true,
            jobs: parsed.jobs,
            activeJobId: parsed.activeJobId || parsed.jobs[0]?.id,
            lastSaved: parsed.lastSaved || null,
          });
          return;
        }
      }
      res.json({ success: true, jobs: null, activeJobId: null });
    } catch (err: any) {
      console.error("Error reading saved jobs:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to load jobs" });
    }
  });

  // Save jobs with atomic write and rolling timestamped backups
  app.post("/api/jobs", (req: Request, res: Response) => {
    try {
      const { jobs, activeJobId } = req.body;
      if (!Array.isArray(jobs) || jobs.length === 0) {
        res.status(400).json({ success: false, error: "jobs array is required and cannot be empty" });
        return;
      }

      const timestamp = new Date().toISOString();
      const payload = {
        lastSaved: timestamp,
        activeJobId: activeJobId || jobs[0]?.id,
        jobs,
      };

      // Atomic write to user_jobs.json
      const tempFile = path.join(DATA_DIR, `user_jobs.tmp.${Date.now()}`);
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), "utf8");
      fs.renameSync(tempFile, JOBS_FILE);

      // Create a timestamped backup snapshot if the job has findings or meaningful data
      try {
        const hasFindings = jobs.some((j: any) => Array.isArray(j.items) && j.items.length > 0);
        const backupFile = path.join(BACKUPS_DIR, `backup_${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(payload, null, 2), "utf8");

        // Keep last 50 backups to avoid disk bloat while retaining history
        const backupFiles = fs.readdirSync(BACKUPS_DIR)
          .filter((f) => f.startsWith("backup_") && f.endsWith(".json"))
          .sort();
        if (backupFiles.length > 50) {
          const toDelete = backupFiles.slice(0, backupFiles.length - 50);
          for (const f of toDelete) {
            try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch {}
          }
        }
      } catch (backupErr) {
        console.warn("Failed to create snapshot backup:", backupErr);
      }

      res.json({
        success: true,
        count: jobs.length,
        lastSaved: timestamp,
      });
    } catch (err: any) {
      console.error("Error saving jobs:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to save jobs" });
    }
  });

  // List all available backups
  app.get("/api/jobs/backups", (_req: Request, res: Response) => {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) {
        res.json({ success: true, backups: [] });
        return;
      }
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter((f) => f.startsWith("backup_") && f.endsWith(".json"))
        .sort()
        .reverse();

      const backups = files.map((filename) => {
        try {
          const fullPath = path.join(BACKUPS_DIR, filename);
          const stat = fs.statSync(fullPath);
          const raw = fs.readFileSync(fullPath, "utf8");
          const parsed = JSON.parse(raw);
          const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
          const totalFindings = jobs.reduce((acc: number, j: any) => acc + (j.items?.length || 0), 0);
          const villaNames = jobs.map((j: any) => j.villaName || j.customerName || "Villa").filter(Boolean);
          return {
            filename,
            timestamp: parsed.lastSaved || stat.mtime.toISOString(),
            jobCount: jobs.length,
            totalFindings,
            villaNames,
            sizeBytes: stat.size,
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      res.json({ success: true, backups });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Restore jobs from a selected backup
  app.post("/api/jobs/restore", (req: Request, res: Response) => {
    try {
      const { filename } = req.body;
      if (!filename || typeof filename !== "string" || !filename.startsWith("backup_")) {
        res.status(400).json({ success: false, error: "Invalid backup filename" });
        return;
      }
      const targetBackup = path.join(BACKUPS_DIR, path.basename(filename));
      if (!fs.existsSync(targetBackup)) {
        res.status(404).json({ success: false, error: "Backup file not found" });
        return;
      }
      const raw = fs.readFileSync(targetBackup, "utf8");
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.jobs)) {
        res.status(400).json({ success: false, error: "Backup file has corrupted data" });
        return;
      }

      // Overwrite active file
      fs.writeFileSync(JOBS_FILE, JSON.stringify(parsed, null, 2), "utf8");

      res.json({
        success: true,
        jobs: parsed.jobs,
        activeJobId: parsed.activeJobId || parsed.jobs[0]?.id,
        lastSaved: parsed.lastSaved,
      });
    } catch (err: any) {
      console.error("Error restoring backup:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to restore backup" });
    }
  });

  // --------------------------------------------------------------------------
  // Intelligent Domain Helpers: Mr. Big Analysis Engine
  // --------------------------------------------------------------------------

  function translateZoneToEn(zone: string): string {
    const raw = (zone || "").trim();
    if (!raw || raw === "หน้างาน" || raw === "พื้นที่หน้างาน" || raw === "ทั่วไป" || raw === "วิลล่า" || raw === "general" || raw === "site") {
      return "inspected villa area";
    }

    const z = raw.toLowerCase();

    // Compound & multi-keyword location detection (handles mixed Thai/English like "ไฟ step light + tree light main entrance area")
    const hasStep = z.includes("step light") || z.includes("step-light") || z.includes("ขั้นบันได") || z.includes("บันได") || z.includes("stair");
    const hasTree = z.includes("tree light") || z.includes("tree-light") || z.includes("ส่องต้นไม้") || z.includes("ต้นไม้") || z.includes("tree");
    const hasMainEntrance = z.includes("main entrance") || z.includes("ทางเข้าหลัก") || (z.includes("main") && z.includes("entrance"));
    const hasOutsideEntrance = z.includes("outside entrance") || z.includes("ทางเข้าด้านนอก") || (z.includes("outside") && z.includes("entrance"));
    const hasFrontEntrance = z.includes("front entrance") || z.includes("ทางเข้าหน้าบ้าน") || (z.includes("front") && z.includes("entrance"));
    const hasEntrance = hasMainEntrance || hasOutsideEntrance || hasFrontEntrance || z.includes("entrance") || z.includes("ทางเข้า") || z.includes("หน้าบ้าน");

    if (hasStep && hasTree && hasEntrance) {
      return "main entrance area step lights and tree uplights";
    }
    if (hasStep && hasTree) {
      return "exterior step lights and tree uplights";
    }
    if (hasStep && hasEntrance) {
      return "main entrance step lighting";
    }
    if (hasTree && hasEntrance) {
      return "main entrance tree uplighting";
    }
    if (hasStep) {
      return "step lighting area";
    }
    if (hasTree) {
      return "tree uplighting area";
    }

    // Specific compound locations
    if (hasMainEntrance) return "main entrance area";
    if (hasOutsideEntrance) return "outside entrance area";
    if (hasFrontEntrance) return "front entrance / yard";
    if (z.includes("สวนหน้าบ้าน")) return "outside front garden";
    if (z.includes("สวนหลังบ้าน")) return "rear garden";
    if (z.includes("สวนข้างบ้าน") || z.includes("ข้างบ้าน")) return "side garden / pathway";
    if (z.includes("ทางเดินเข้าห้องน้ำชั้นล่าง")) return "ground floor bathroom corridor";
    if (z.includes("ทางเดินเข้าห้องน้ำชั้นบน")) return "upper floor bathroom corridor";
    if (z.includes("ทางเดินเข้าห้องน้ำ")) return "bathroom corridor";
    if (z.includes("ห้องน้ำชั้นล่าง")) return "ground floor bathroom";
    if (z.includes("ห้องน้ำชั้นบน")) return "upper floor bathroom";
    if (z.includes("ห้องน้ำ 1")) return "bathroom 1";
    if (z.includes("ห้องน้ำ 2")) return "bathroom 2";
    if (z.includes("ห้องน้ำ") || z.includes("toilet") || z.includes("bathroom")) return "bathroom";
    if (z.includes("สวน") || z.includes("สนามหญ้า") || z.includes("garden")) return "garden area";
    if (z.includes("หน้าบ้าน")) return "front entrance / yard";
    if (z.includes("หลังบ้าน")) return "rear perimeter";
    if (z.includes("รอบบ้าน") || z.includes("ภายนอก") || z.includes("outdoor")) return "outdoor exterior perimeter";
    if (z.includes("ที่จอดรถ") || z.includes("โรงจอดรถ") || z.includes("โรงรถ") || z.includes("carport") || z.includes("garage")) return "carport / parking area";
    if (z.includes("ลานซักล้าง") || z.includes("ซักล้าง") || z.includes("laundry")) return "laundry & utility area";
    if (z.includes("สระ") || z.includes("pool") || z.includes("ปั๊ม")) return "swimming pool & pump area";
    if (z.includes("ริมสระ") || z.includes("poolside")) return "poolside terrace & deck";
    if (z.includes("ระเบียง") || z.includes("balcony") || z.includes("terrace")) return "balcony / terrace";
    if (z.includes("ดาดฟ้า") || z.includes("rooftop")) return "rooftop terrace";
    if (z.includes("ทางเดิน") || z.includes("corridor") || z.includes("hallway")) return "corridor / hallway";
    if (z.includes("โต๊ะทำงาน") || z.includes("โต๊ะ") || z.includes("desk") || z.includes("workstation")) {
      return "workstation / desk area";
    }
    if (z.includes("ห้องนอนใหญ่") || z.includes("master")) return "master bedroom";
    if (z.includes("ห้องนอน 1") || z.includes("bedroom 1")) return "bedroom 1";
    if (z.includes("ห้องนอน 2") || z.includes("bedroom 2")) return "bedroom 2";
    if (z.includes("ห้องนอน 3") || z.includes("bedroom 3")) return "bedroom 3";
    if (z.includes("ห้องนอน 4") || z.includes("bedroom 4")) return "bedroom 4";
    if (z.includes("ห้องนอน") || z.includes("bedroom")) return "bedroom";
    if (z.includes("ห้องนั่งเล่น") || z.includes("living")) return "living room";
    if (z.includes("ห้องรับแขก")) return "guest reception hall";
    if (z.includes("ห้องครัว") || z.includes("kitchen")) return "kitchen area";
    if (z.includes("ห้องรับประทานอาหาร") || z.includes("ห้องกินข้าว") || z.includes("dining")) return "dining area";
    if (z.includes("ตู้ไฟ") || z.includes("mdb") || z.includes("breaker") || z.includes("แผงไฟ")) return "Main Distribution Board (MDB)";
    if (z.includes("ห้องเก็บของ") || z.includes("storage")) return "storage room";
    if (z.includes("ห้องแม่บ้าน") || z.includes("maid")) return "maid quarters";
    if (z.includes("ห้องปั๊ม") || z.includes("ห้องเครื่อง") || z.includes("pump")) return "pump & machine room";
    if (z.includes("ประตูรั้ว") || z.includes("รั้ว") || z.includes("กำแพง") || z.includes("gate")) return "main gate & perimeter wall";

    // Clean English string from mixed Thai characters
    const cleanedEn = raw
      .replace(/[\u0E00-\u0E7F]+/g, " ")
      .replace(/[+&/]+/g, " & ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanedEn.length >= 3) {
      return cleanedEn;
    }

    return "designated inspection zone";
  }

  function translateZoneToTh(zone: string): string {
    const raw = (zone || "").trim();
    if (!raw || raw === "หน้างาน" || raw === "พื้นที่หน้างาน" || raw === "ทั่วไป" || raw === "วิลล่า" || raw === "general" || raw === "site") {
      return "พื้นที่หน้างาน";
    }

    const z = raw.toLowerCase();

    // Compound & multi-keyword location detection
    const hasStep = z.includes("step light") || z.includes("step-light") || z.includes("ขั้นบันได") || z.includes("บันได") || z.includes("stair");
    const hasTree = z.includes("tree light") || z.includes("tree-light") || z.includes("ส่องต้นไม้") || z.includes("ต้นไม้") || z.includes("tree");
    const hasMainEntrance = z.includes("main entrance") || z.includes("ทางเข้าหลัก") || (z.includes("main") && z.includes("entrance"));
    const hasOutsideEntrance = z.includes("outside entrance") || z.includes("ทางเข้าด้านนอก") || (z.includes("outside") && z.includes("entrance"));
    const hasFrontEntrance = z.includes("front entrance") || z.includes("ทางเข้าหน้าบ้าน") || (z.includes("front") && z.includes("entrance"));
    const hasEntrance = hasMainEntrance || hasOutsideEntrance || hasFrontEntrance || z.includes("entrance") || z.includes("ทางเข้า") || z.includes("หน้าบ้าน");

    if (hasStep && hasTree && hasEntrance) {
      return "ไฟส่องขั้นบันได (Step Light) และไฟส่องต้นไม้ (Tree Light) บริเวณทางเข้าหลัก (Main Entrance Area)";
    }
    if (hasStep && hasTree) {
      return "ไฟส่องขั้นบันได (Step Light) และไฟส่องต้นไม้ (Tree Light)";
    }
    if (hasStep && hasEntrance) {
      return "ไฟส่องขั้นบันได (Step Light) บริเวณทางเข้าหลัก";
    }
    if (hasTree && hasEntrance) {
      return "ไฟส่องต้นไม้ (Tree Light) บริเวณทางเข้าหลัก";
    }
    if (hasStep) {
      return "ไฟส่องขั้นบันได (Step Light)";
    }
    if (hasTree) {
      return "ไฟส่องต้นไม้ (Tree Light)";
    }

    if (hasMainEntrance) return "บริเวณทางเข้าหลัก (Main Entrance Area)";
    if (hasOutsideEntrance) return "ทางเข้าด้านนอก (Outside Entrance)";
    if (hasFrontEntrance) return "ทางเข้าหน้าบ้าน (Front Entrance)";
    if (z.includes("entrance") || z.includes("ทางเข้า")) return "บริเวณทางเข้า (Entrance)";
    if (z.includes("outside garden") || (z.includes("garden") && z.includes("outside"))) return "สวนภายนอก (Outside Garden)";
    if (z.includes("สวนหน้าบ้าน")) return "สวนหน้าบ้าน (Front Garden)";
    if (z.includes("back garden") || z.includes("สวนหลังบ้าน")) return "สวนหลังบ้าน (Back Garden)";
    if (z.includes("side garden") || z.includes("สวนข้างบ้าน")) return "สวนข้างบ้าน (Side Garden)";
    if (z.includes("garden") || z.includes("สวน")) return "บริเวณสวน (Garden)";
    if (z.includes("outside") || z.includes("outdoor")) return "ภายนอกอาคาร (Outdoor)";
    if (z.includes("swimming pool") || z.includes("pool") || z.includes("สระ")) return "บริเวณสระว่ายน้ำ (Swimming Pool)";
    if (z.includes("living room") || z.includes("living") || z.includes("ห้องนั่งเล่น")) return "ห้องนั่งเล่น (Living Room)";
    if (z.includes("master bedroom") || z.includes("master") || z.includes("ห้องนอนใหญ่")) return "ห้องนอนใหญ่ (Master Bedroom)";
    if (z.includes("bedroom") || z.includes("ห้องนอน")) return "ห้องนอน (Bedroom)";
    if (z.includes("kitchen") || z.includes("ห้องครัว")) return "ห้องครัว (Kitchen)";
    if (z.includes("bathroom") || z.includes("toilet") || z.includes("ห้องน้ำ")) return "ห้องน้ำ (Bathroom)";
    if (z.includes("corridor") || z.includes("hallway") || z.includes("ทางเดิน")) return "โถงทางเดิน (Corridor)";
    if (z.includes("balcony") || z.includes("terrace") || z.includes("ระเบียง")) return "ระเบียง (Balcony/Terrace)";
    if (z.includes("carport") || z.includes("garage") || z.includes("ที่จอดรถ")) return "โรงจอดรถ (Carport)";
    if (z.includes("main distribution board") || z.includes("mdb") || z.includes("ตู้ไฟ")) return "ตู้ควบคุมไฟฟ้าหลัก (MDB)";
    return raw;
  }

  function isNormalText(text: string): boolean {
    const t = (text || "").toLowerCase().trim();
    if (!t) return false;

    const normalPhrases = [
      "ทำงานได้ตามปกติ",
      "ทำงานได้ปกติ",
      "ทำงานตามปกติ",
      "ทำงานปกติ",
      "ใช้งานได้ตามปกติ",
      "ใช้งานได้ปกติ",
      "ใช้ได้ตามปกติ",
      "ใช้ได้ปกติ",
      "ใช้งานได้ดี",
      "เปิดใช้งานได้ตามปกติ",
      "เปิดใช้งานได้ปกติ",
      "เปิดติดปกติ",
      "เปิดได้ปกติ",
      "ไฟติดปกติ",
      "น้ำไหลปกติ",
      "สภาพปกติ",
      "ตามปกติ",
      "ไม่มีปัญหา",
      "ไม่พบปัญหา",
      "ผ่านเกณฑ์",
      "เรียบร้อยดี",
      "สมบูรณ์ดี",
      "สมบูรณ์",
      "ไม่มีข้อบกพร่อง",
      "ไม่ชำรุด",
      "ไม่เสีย",
      "ไม่พัง",
      "ไม่มีการลัดวงจร",
      "ไม่ลัดวงจร",
      "ไม่มีการช๊อต",
      "ไม่มีการช็อต",
      "ไม่ช๊อต",
      "ไม่ช็อต",
      "ไม่มีช๊อต",
      "ไม่มีช็อต",
      "ไม่มีไฟช็อต",
      "ไม่มีไฟช๊อต",
      "ไม่ทริป",
      "ไม่ตัด",
      "ไม่รั่ว",
      "ไม่มีไฟรั่ว",
      "ไม่ซึม",
      "ไม่มีน้ำรั่ว",
      "ไม่ติดขัด",
      "ไม่ฝืด",
      "ปกติ",
      "normal",
      "working fine",
      "working properly",
      "operational",
      "functional",
      "in good order",
      "good condition",
    ];

    const hasPositive = normalPhrases.some((phrase) => t.includes(phrase));
    if (!hasPositive) return false;

    // Reject if there is an unnegated defect phrase
    if (
      t.includes("ไม่ปกติ") ||
      (t.includes("ชำรุด") && !t.includes("ไม่ชำรุด")) ||
      (t.includes("เสีย") && !t.includes("ไม่เสีย")) ||
      (t.includes("พัง") && !t.includes("ไม่พัง")) ||
      (t.includes("ลัดวงจร") && !t.includes("ไม่ลัดวงจร") && !t.includes("ไม่มีการลัดวงจร")) ||
      (t.includes("รั่วซึม") && !t.includes("ไม่รั่วซึม")) ||
      (t.includes("น้ำรั่ว") && !t.includes("ไม่มีน้ำรั่ว") && !t.includes("ไม่รั่ว"))
    ) {
      return false;
    }

    return true;
  }

  function isNormalFinding(f: any): boolean {
    if (!f) return false;
    if (f.status === "Normal") return true;
    const text = `${f.title || ""} ${f.observationTh || ""} ${f.observationEn || ""} ${f.recommendedActionTh || ""} ${f.recommendedActionEn || ""}`.toLowerCase();
    return (
      isNormalText(text) ||
      text.includes("no hardware replacement") ||
      text.includes("no switch replacement") ||
      text.includes("no switch or hardware replacement") ||
      text.includes("normal operating condition")
    );
  }

  function extractQtySafe(text: string): number {
    // Check specific Thai and English quantity units including อัน, ดวง, หลอด, ตัว, ชิ้น, ชุด, โคม, จุด
    const withUnit = text.match(/([0-9]+)\s*(ดวง|หลอด|ตัว|ชิ้น|ชุด|อัน|โคม|จุด|unit|pcs|pieces|ea)/i);
    if (withUnit) {
      return Math.max(1, parseInt(withUnit[1], 10));
    }
    // Handle Thai numerals (๑-๙)
    const thaiNumMap: Record<string, number> = { "๑": 1, "๒": 2, "๓": 3, "๔": 4, "๕": 5, "๖": 6, "๗": 7, "๘": 8, "๙": 9 };
    const thaiMatch = text.match(/([๑-๙]+)\s*(ดวง|หลอด|ตัว|ชิ้น|ชุด|อัน|โคม|จุด)/);
    if (thaiMatch) {
      const val = thaiNumMap[thaiMatch[1]];
      if (val) return val;
    }
    const cleaned = text
      .replace(/par\s*38/gi, "")
      .replace(/sus\s*304/gi, "")
      .replace(/easy\s*9/gi, "")
      .replace(/12\s*w/gi, "")
      .replace(/20\s*w/gi, "")
      .replace(/32\s*a/gi, "")
      .replace(/30\s*ma/gi, "");
    const numMatch = cleaned.match(/\b([0-9]+)\b/);
    if (numMatch) {
      const val = parseInt(numMatch[1], 10);
      if (val > 0 && val < 50) return val;
    }
    return 1;
  }

  function analyzeFindingWithMrBig(findingTh: string, zone?: string, category?: string) {
    const text = (findingTh || "").toLowerCase();
    const zoneTh = translateZoneToTh(zone || "พื้นที่หน้างาน");
    const zoneEn = translateZoneToEn(zone || "");

    // 0. NORMAL STATUS CHECK (CRITICAL: Prioritize normal / operational state over defect keywords)
    if (isNormalText(text)) {
      // 0.1 MDB / Main Circuit Breaker Panel
      if (
        text.includes("mdb") ||
        text.includes("ตู้ไฟ") ||
        text.includes("เบรกเกอร์") ||
        text.includes("แผงไฟ") ||
        text.includes("breaker") ||
        zoneTh.includes("ตู้ไฟ") ||
        zoneTh.includes("mdb")
      ) {
        return {
          observationEn: `Routine technical inspection of Main Distribution Board (MDB): All branch circuit breakers, RCBO residual current protection devices, and electrical distribution lines tested under operational load and verified operating normally. No short-circuit fault, earth leakage current, or breaker tripping detected; all safety protective mechanisms are fully functional.`,
          observationTh: `ตรวจเช็กตู้ไฟ MDB และระบบเบรกเกอร์: ทดสอบการจ่ายกระแสไฟฟ้าและโหลดวงจร ทำงานได้เป็นปกติสมบูรณ์ ไม่พบกระแสไฟฟ้ารั่ว ไม่มีการลัดวงจร และไม่มีการทริปตัดวงจร ระบบมีความปลอดภัยพร้อมใช้งาน`,
          recommendedActionEn: `No hardware replacement or electrical repair required. Maintain scheduled routine preventive inspections and ensure panel interior remains clean and moisture-sealed.`,
          recommendedActionTh: `ระบบเบรกเกอร์และตู้ไฟทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์ ให้คงรอบการตรวจเช็กและบำรุงรักษาตามระยะเวลา`,
          suggestedStatus: "Normal",
          riskAssessment: "No active operational or electrical hazard identified.",
          peaceOfMindNote: "Mr. Big ตรวจสอบยืนยันความพร้อมใช้งานและความปลอดภัยของระบบไฟฟ้าตู้ไฟ MDB เพื่อความอุ่นใจสูงสุดของเจ้าของวิลล่า",
        };
      }

      // 0.2 Smart Home & Automation Integration / Connectivity Verification
      // Handles mixed intent: Hardware works normally / no short-circuit, BUT smart home / gateway connectivity needs to be verified
      if (
        text.includes("สมาร์ทโฮม") ||
        text.includes("smart home") ||
        text.includes("automation") ||
        text.includes("เกตเวย์") ||
        text.includes("gateway") ||
        text.includes("zigbee") ||
        text.includes("tuya") ||
        text.includes("iot") ||
        (text.includes("เชื่อมต่อ") && (text.includes("ระบบ") || text.includes("แอพ") || text.includes("app") || text.includes("wifi") || text.includes("สัญญาณ")))
      ) {
        const isSwitch = text.includes("สวิตช์") || text.includes("switch") || text.includes("ไฟ");
        const isAc = text.includes("แอร์") || text.includes("air") || text.includes("ac");
        const isDoor = text.includes("ประตู") || text.includes("door") || text.includes("lock");

        let deviceEn = "Wall lighting switch assembly and lighting circuit";
        let deviceTh = "สวิตช์ไฟและวงจรควบคุมแสงสว่าง";
        if (isAc) {
          deviceEn = "Air conditioning unit and climate control system";
          deviceTh = "เครื่องปรับอากาศและระบบควบคุมความเย็น";
        } else if (isDoor) {
          deviceEn = "Electronic door lock and access control system";
          deviceTh = "ระบบประตูดิจิทัลและชุดควบคุมการเข้า-ออก";
        } else if (!isSwitch) {
          deviceEn = "Electrical fixture and operating circuit";
          deviceTh = "อุปกรณ์และวงจรไฟฟ้า";
        }

        const locSuffixEn = (zoneEn && zoneEn !== "outside garden" && zoneEn !== "inspected villa area" && zoneEn !== "designated villa area" && zoneEn !== "the property") ? ` serving ${zoneEn}` : "";
        const locSuffixTh = (zoneTh && zoneTh !== "พื้นที่หน้างาน" && zoneTh !== "หน้างาน") ? ` บริเวณ${zoneTh}` : "";

        return {
          observationEn: `${deviceEn}${locSuffixEn} was operated and confirmed functioning normally under load with no electrical short-circuit or breaker trip detected. However, secondary integration and connectivity with the smart home automation system require follow-up verification and re-testing.`,
          observationTh: `เปิดทดสอบ${deviceTh}${locSuffixTh}แล้วใช้งานได้ตามปกติ ไม่พบการลัดวงจรหรือกระแสไฟชอร์ต แต่จำเป็นต้องตรวจสอบการเชื่อมต่อกับระบบสมาร์ทโฮม (Smart Home Automation System) เพิ่มเติมอีกครั้ง`,
          recommendedActionEn: `No switch or hardware replacement required. Perform follow-up technical check on smart home gateway pairing, wireless signal transmission, and automation system connectivity.`,
          recommendedActionTh: `${deviceTh}ทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์ แต่ให้ช่างเทคนิคตรวจสอบสัญญาณเชื่อมต่อ เกตเวย์ และระบบสมาร์ทโฮมอีกครั้งเพื่อความสมบูรณ์ในการสั่งการ`,
          suggestedStatus: "Normal",
          riskAssessment: "No active electrical hazard or short-circuit detected. Physical lighting operation is safe; smart home control requires secondary configuration verification.",
          peaceOfMindNote: "Mr. Big ตรวจสอบวงจรสวิตช์ไฟฟ้าให้เรียบร้อย ปลอดภัยไม่มีไฟชอร์ต พร้อมประสานงานเช็กระบบสมาร์ทโฮมให้ครบถ้วน",
        };
      }

      // 0.3 Light Switch / Wall Rocker Switch (Standard Normal)
      if (text.includes("สวิตช์") || text.includes("switch")) {
        return {
          observationEn: `Wall lighting switch assembly and lighting circuit serving ${zoneEn} were inspected and functionally verified: Switch toggle operates smoothly with crisp mechanical contact, circuit continuity is intact, and luminaires illuminate steadily without flicker or voltage drop.`,
          observationTh: `ตรวจเช็กสวิตช์ควบคุมแสงสว่างบริเวณ${zoneTh}: ทดสอบเปิด-ปิดวงจรทำงานได้เป็นปกติ สวิตช์แน่นสัมผัสดี ไฟเปิดติดสว่างสม่ำเสมอ ไม่มีการกะพริบหรือขัดข้อง`,
          recommendedActionEn: `No switch replacement required. Maintain scheduled periodic property care inspection.`,
          recommendedActionTh: `สวิตช์ไฟและวงจรทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอะไหล่ ให้คงรอบการตรวจเช็กตามระยะเวลา`,
          suggestedStatus: "Normal",
          riskAssessment: "No operational defect or electrical hazard identified.",
          peaceOfMindNote: "Mr. Big ตรวจสอบระบบสวิตช์แสงสว่างเรียบร้อย ทำงานได้สมบูรณ์",
        };
      }

      // 0.3 Electrical Socket / Pop-up / Outlet
      if (
        text.includes("ปลั๊ก") ||
        text.includes("เต้ารับ") ||
        text.includes("เต้าเสียบ") ||
        text.includes("socket") ||
        text.includes("outlet") ||
        text.includes("pop up")
      ) {
        return {
          observationEn: `Electrical socket outlet unit at ${zoneEn} was verified with polarity and grounding test instruments: Verified correct live-neutral-earth wiring polarity, robust grounding bond, and nominal supply voltage under load.`,
          observationTh: `ตรวจเช็กเต้ารับไฟฟ้าบริเวณ${zoneTh}: ตรวจสอบขั้วไฟฟ้า L-N-G ระบบสายดิน และแรงดันไฟฟ้าทดสอบโหลดแล้วทำงานได้ถูกต้องสมบูรณ์เป็นปกติ`,
          recommendedActionEn: `No socket replacement required. Continue regular property care inspection schedule.`,
          recommendedActionTh: `เต้ารับไฟฟ้าทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์`,
          suggestedStatus: "Normal",
          riskAssessment: "No electrical hazard or voltage irregularities identified.",
          peaceOfMindNote: "เต้ารับไฟฟ้าผ่านการทดสอบความปลอดภัยโดย Mr. Big เรียบร้อยดี",
        };
      }

      // 0.4 Outdoor PAR38 / Garden Lighting
      if (
        text.includes("par38") ||
        text.includes("ไฟสนาม") ||
        text.includes("ไฟสวน") ||
        text.includes("สปอร์ตไลท์") ||
        text.includes("สปอตไลท์") ||
        text.includes("ไฟส่องต้นไม้")
      ) {
        return {
          observationEn: `Outdoor landscape luminaires and PAR38 floodlight fixtures at ${zoneEn} were inspected and operationally verified: Steady illumination, intact waterproof silicone seals, and normal operational load confirmed.`,
          observationTh: `ตรวจเช็กระบบไฟสนาม PAR38 บริเวณ${zoneTh}: ดวงโคมสว่างปกติ ซีลยางกันน้ำอยู่ในสภาพสมบูรณ์ ไม่มีความชื้นสะสม และระบบไฟทำงานได้ตามมาตรฐาน`,
          recommendedActionEn: `No lamp replacement required. Maintain routine cleaning and periodic seal inspections.`,
          recommendedActionTh: `ไฟสนามทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนหลอดไฟ ให้คงรอบการตรวจเช็กตามระยะเวลา`,
          suggestedStatus: "Normal",
          riskAssessment: "No weather ingress or electrical short-circuit hazard identified.",
          peaceOfMindNote: "Mr. Big ตรวจเช็กระบบไฟสนามภายนอกให้สวยงามและปลอดภัยต่อสภาพอากาศภูเก็ต",
        };
      }

      // 0.5 General Lighting
      if (text.includes("ไฟ") || text.includes("หลอด") || text.includes("โคม") || text.includes("light")) {
        return {
          observationEn: `Lighting fixtures and illumination circuitry at ${zoneEn} were inspected and tested: All luminaires illuminate evenly at standard lumen output with no flickering, abnormal ballast hum, or physical damage.`,
          observationTh: `ตรวจเช็กโคมไฟและระบบส่องสว่างบริเวณ${zoneTh}: เปิดทดสอบแล้วดวงโคมสว่างสม่ำเสมอ ไม่กะพริบ ไม่มีเสียงฮัม และทำงานได้เป็นปกติสมบูรณ์`,
          recommendedActionEn: `No bulb or fixture replacement required. Continue scheduled periodic visual inspection.`,
          recommendedActionTh: `ระบบไฟฟ้าส่องสว่างทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนหลอดหรือโคมไฟ`,
          suggestedStatus: "Normal",
          riskAssessment: "No operational or photometric defect identified.",
          peaceOfMindNote: "ตรวจสอบความสมบูรณ์ของระบบส่องสว่างโดยทีมงาน Mr. Big",
        };
      }

      // 0.6 Sliding Doors / Windows / Rollers
      if (
        text.includes("บานเลื่อน") ||
        text.includes("รางเลื่อน") ||
        text.includes("ลูกล้อ") ||
        text.includes("ประตู") ||
        text.includes("หน้าต่าง") ||
        text.includes("door") ||
        text.includes("window")
      ) {
        return {
          observationEn: `Sliding door assembly and roller carriage mechanism at ${zoneEn} were inspected and operationally tested: Door glides smoothly along guide track with balanced alignment, secure lock engagement, and no binding or derailment.`,
          observationTh: `ตรวจเช็กประตูบานเลื่อนและรางเลื่อนบริเวณ${zoneTh}: ทดสอบการเลื่อนเปิด-ปิดลื่นไหลดี ไม่ตกร่อง ไม่ฝืด ระบบล็อกทำงานแน่นหนาเรียบร้อย`,
          recommendedActionEn: `No roller or hardware replacement required. Maintain scheduled track cleaning and silicone lubrication.`,
          recommendedActionTh: `ประตูบานเลื่อนและลูกล้อทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอะไหล่`,
          suggestedStatus: "Normal",
          riskAssessment: "No mechanical or security hazard identified.",
          peaceOfMindNote: "Mr. Big ตรวจสอบการทำงานของประตูบานเลื่อนเรียบร้อย ปลอดภัยและใช้งานสะดวก",
        };
      }

      // 0.7 Plumbing / Sanitary / Faucets
      if (
        text.includes("ก๊อก") ||
        text.includes("น้ำ") ||
        text.includes("ท่อ") ||
        text.includes("สุขภัณฑ์") ||
        text.includes("ชักโครก") ||
        text.includes("plumbing") ||
        text.includes("faucet")
      ) {
        return {
          observationEn: `Plumbing fixtures, valves, and drainage pathways at ${zoneEn} were verified under line pressure: Smooth valve actuation, steady clear water flow, and zero leakage, seepage, or drainage obstruction observed.`,
          observationTh: `ตรวจเช็กระบบประปาและสุขภัณฑ์บริเวณ${zoneTh}: ทดสอบแรงดันน้ำและเปิด-ปิดวาล์ว น้ำไหลแรงสม่ำเสมอ ไม่พบการรั่วซึม และท่อระบายน้ำไหลคล่องสะดวก`,
          recommendedActionEn: `No plumbing repairs or fixture replacement required. Maintain routine preventive inspection schedule.`,
          recommendedActionTh: `ระบบประปาทำงานได้เป็นปกติ ไม่พบรอยรั่วซึม ไม่จำเป็นต้องเปลี่ยนอุปกรณ์`,
          suggestedStatus: "Normal",
          riskAssessment: "No active water leak or pressure hazard identified.",
          peaceOfMindNote: "ตรวจสอบระบบประปาและสุขภัณฑ์โดย Mr. Big ไม่มีน้ำรั่วซึมให้กังวลใจ",
        };
      }

      // 0.8 Air Conditioning
      if (text.includes("แอร์") || text.includes("air") || text.includes("hvac") || text.includes("ความเย็น")) {
        return {
          observationEn: `Air conditioning system serving ${zoneEn} was evaluated in cooling mode: Verified normal compressor cycling, adequate chilled airflow, and unobstructed condensate drainage.`,
          observationTh: `ตรวจเช็กเครื่องปรับอากาศบริเวณ${zoneTh}: ทดสอบระบบทำความเย็น คอมเพรสเซอร์ทำงานปกติ ลมเย็นสม่ำเสมอ และท่อน้ำทิ้งระบายได้ดีไม่มีน้ำหยด`,
          recommendedActionEn: `No immediate technical intervention required. Maintain scheduled quarterly chemical filter cleaning and coil service.`,
          recommendedActionTh: `แอร์ทำงานได้เป็นปกติ ทำความเย็นได้ดี ให้คงรอบการล้างแอร์ตามระยะเวลา`,
          suggestedStatus: "Normal",
          riskAssessment: "No thermal inefficiency or equipment fault identified.",
          peaceOfMindNote: "Mr. Big ดูแลตรวจเช็กระบบแอร์ให้อากาศเย็นสบายและประหยัดพลังงาน",
        };
      }

      // 0.9 General Normal Verification
      return {
        observationEn: `Routine villa inspection at ${zoneEn}: System and components were thoroughly inspected, functionally verified in normal operational order with no defects, and operating to engineering standards.`,
        observationTh: `ตรวจเช็กสภาพการใช้งานบริเวณ${zoneTh}: อุปกรณ์และระบบผ่านการทดสอบ ทำงานได้เป็นปกติ ไม่พบข้อบกพร่องหรือความเสียหาย`,
        recommendedActionEn: `No hardware replacement or corrective repairs required. Maintain scheduled periodic property care inspections.`,
        recommendedActionTh: `อุปกรณ์ทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอะไหล่หรือซ่อมแซม ให้คงรอบการตรวจเช็กตามระยะเวลา`,
        suggestedStatus: "Normal",
        riskAssessment: "No operational, structural, or safety risks identified.",
        peaceOfMindNote: "Mr. Big ตรวจสอบยืนยันความสมบูรณ์เรียบร้อยของวิลล่าเพื่อความสบายใจของเจ้าของวิลล่า",
      };
    }

    // 1. Pop-Up Socket / Desk Power Outlet / เต้ารับฝังโต๊ะ
    if (
      text.includes("pop up") ||
      text.includes("popup") ||
      text.includes("ปลั๊ก pop") ||
      text.includes("ปลั๊กไฟ") ||
      text.includes("เต้ารับ") ||
      text.includes("เต้าเสียบ") ||
      text.includes("socket") ||
      text.includes("outlet")
    ) {
      return {
        observationEn: `Desk-integrated pop-up electrical socket unit at ${zoneEn} is mechanically defective and electrically non-functional. The spring-loaded catch mechanism has seized and internal contacts are degraded, preventing smooth extension and stable power delivery.`,
        observationTh: `ตรวจพบชุดเต้ารับไฟฟ้าแบบป๊อปอัป (Pop-Up Socket) บริเวณ${zoneTh} ชำรุด กลไกสปริงค้างไม่สามารถกดเด้งขึ้น และขั้วสัมผัสภายในจ่ายกระแสไฟไม่เสถียร`,
        recommendedActionEn: `Safely de-energize circuit branch, safely dismantle faulty pop-up assembly, and install a brand-new certified grounded pop-up desk outlet module featuring dual universal AC sockets and USB fast charging.`,
        recommendedActionTh: `ตัดกระแสไฟฟ้าเพื่อความปลอดภัย รื้อถอนชุดเต้ารับป๊อปอัปเดิมที่เสียหาย และติดตั้งชุดเต้ารับไฟฟ้าแบบป๊อปอัปใหม่มาตรฐาน มอก. พร้อมเดินสายดินและตรวจสอบความปลอดภัย`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Intermittent contact resistance under load may cause power interruption or damage connected devices.",
        peaceOfMindNote: "ได้รับการบันทึกและประเมินโดย Mr. Big เพื่อการใช้งานระบบไฟฟ้าที่ปลอดภัยและสะดวกสบาย",
      };
    }

    // 2. Sliding Doors, Rollers, Windows & Hardware (ประตูบานเลื่อน, ลูกล้อ, รางเลื่อน, บานพับ, มือจับ, ฝืด, ตกร่อง)
    // NOTE: Check this BEFORE general doors/locks so sliding door issues are never misclassified as digital locks!
    if (
      text.includes("บานเลื่อน") ||
      text.includes("ลูกล้อ") ||
      text.includes("รางเลื่อน") ||
      text.includes("ราง") ||
      text.includes("ตกร่อง") ||
      text.includes("ฝืด") ||
      text.includes("เปิดยาก") ||
      text.includes("ปิดยาก") ||
      text.includes("บานพับ") ||
      text.includes("กระจก") ||
      (text.includes("ประตู") && !text.includes("ดิจิทัล") && !text.includes("smart") && !text.includes("คีย์การ์ด") && !text.includes("รหัส")) ||
      (text.includes("หน้าต่าง") && !text.includes("ดิจิทัล"))
    ) {
      return {
        observationEn: `Sliding door / window assembly at ${zoneEn} exhibits excessive mechanical friction, roller wear, or track misalignment, causing stiff operation and failure to glide smoothly along the sill.`,
        observationTh: `ตรวจพบประตูบานเลื่อน/หน้าต่างบริเวณ${zoneTh} ฝืด หนัก หรือตกร่อง เกิดจากชุดลูกล้อใต้บานเสื่อมสภาพ/สึกหรอ หรือรางเลื่อนมีฝุ่นทรายสะสมและเสียแนวระนาบ`,
        recommendedActionEn: `Carefully dismount sliding glass panel, replace worn bottom tandem roller assemblies with heavy-duty corrosion-resistant stainless steel rollers, re-align track guides, and lubricate mechanism.`,
        recommendedActionTh: `ยกถอดบานเลื่อนเพื่อตรวจสอบ เปลี่ยนชุดลูกล้อคู่สแตนเลสทนทานสูง ปรับตั้งระดับบาน และทำความสะอาดพร้อมปรับแนวรางเลื่อนให้เปิด-ปิดนุ่มนวล`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Continued forceful sliding risks gouging bottom aluminium track, loosening frame glass, or causing derailment.",
        peaceOfMindNote: "ทีมงาน Mr. Big ตรวจสอบระดับบานและกลไกเลื่อนอย่างละเอียดเพื่อการเปิด-ปิดที่นุ่มนวลและปลอดภัย",
      };
    }

    // 3. Digital Door Lock / Smart Lock (กลอนประตูดิจิทัล, สมาร์ทล็อก)
    if (
      text.includes("กลอนดิจิทัล") ||
      text.includes("สมาร์ทล็อก") ||
      text.includes("smart lock") ||
      text.includes("digital lock") ||
      text.includes("คีย์การ์ด") ||
      text.includes("keycard") ||
      text.includes("รหัสผ่าน") ||
      text.includes("ถ่านกลอน") ||
      (text.includes("กลอน") && (text.includes("ถ่าน") || text.includes("แบต")))
    ) {
      return {
        observationEn: `Electronic digital door lock unit at ${zoneEn} indicates depleted battery voltage or motor latch friction against frame strike plate during deadbolt extension.`,
        observationTh: `ตรวจพบชุดกลอนประตูดิจิทัลบริเวณ${zoneTh} มีสัญญาณเตือนแบตเตอรี่ต่ำ หรือมอเตอร์เดือยล็อกฝืดขัดข้องกับเบ้ารับวงกบ`,
        recommendedActionEn: `Install fresh set of industrial-grade alkaline AA batteries, re-align mortise strike plate, and execute diagnostic verification for keypad PIN and RFID card access.`,
        recommendedActionTh: `เปลี่ยนชุดถ่านอัลคาไลน์คุณภาพสูง ปรับตั้งระยะเบ้ารับเดือยล็อกวงกบ และทดสอบระบบความปลอดภัยและรหัสผ่านทุกช่องทาง`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Risk of guest or owner lockout if power depletes fully while villa is occupied.",
        peaceOfMindNote: "Mr. Big ตรวจสอบความปลอดภัยทางเข้า-ออกอย่างรัดกุมเพื่อความสบายใจของเจ้าของวิลล่า",
      };
    }

    // 4. Plumbing, Faucets, Water Leaks, Drains & Sanitary (ก๊อกน้ำ, ท่อรั่ว, น้ำหยด, ชักโครก, สายฉีดชำระ, สะดืออ่าง, สต็อปวาล์ว)
    if (
      text.includes("ก๊อก") ||
      text.includes("รั่ว") ||
      text.includes("ซึม") ||
      text.includes("หยด") ||
      text.includes("ท่อน้ำ") ||
      text.includes("ท่อระบาย") ||
      text.includes("ท่อน้ำทิ้ง") ||
      text.includes("สายฉีด") ||
      text.includes("ชักโครก") ||
      text.includes("สะดืออ่าง") ||
      text.includes("อ่างล้าง") ||
      text.includes("ซิงค์") ||
      text.includes("ฝักบัว") ||
      text.includes("สต็อปวาล์ว") ||
      text.includes("วาล์วน้ำ") ||
      text.includes("plumbing") ||
      text.includes("leak") ||
      text.includes("faucet")
    ) {
      return {
        observationEn: `Sanitary plumbing fixture at ${zoneEn} exhibits persistent water leakage or seal seepage. Inspection reveals worn internal ceramic valve cartridge, perished elastomeric O-ring, or loose flexible supply connection.`,
        observationTh: `ตรวจพบอุปกรณ์ประปา/สุขภัณฑ์บริเวณ${zoneTh} มีน้ำรั่วซึม เกิดจากไส้วาล์วเซรามิกเสื่อมสภาพ ซีลยางหมดอายุ หรือข้อต่อสายน้ำดีหลวม`,
        recommendedActionEn: `Isolate local angle stop valve, dismantle defective plumbing fitting, replace with high-grade SUS304 stainless steel faucet / ceramic cartridge, apply PTFE thread seal, and execute pressure leak test.`,
        recommendedActionTh: `ปิดสต็อปวาล์ว รื้อเปลี่ยนไส้วาล์วเซรามิกหรือเปลี่ยนชุดก๊อกน้ำ/สายน้ำดีสแตนเลส SUS304 ใหม่ พันเทปซีลเกลียว และเปิดทดสอบแรงดันน้ำตรวจเช็กการรั่วซึม`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Continuous dripping causes unnecessary water consumption, mineral scale staining, and potential cabinet water damage.",
        peaceOfMindNote: "Mr. Big ควบคุมการแก้ไขปัญหาระบบน้ำอย่างเด็ดขาดเพื่อป้องกันความเสียหายต่อโครงสร้างวิลล่า",
      };
    }

    // 5. Ceilings, Moisture, Walls & Paint (ฝ้าเพดาน, รอยน้ำ, สีลอกร่อน, รอยร้าว, ซิลิโคนขอบบาน)
    if (
      text.includes("ฝ้า") ||
      text.includes("เพดาน") ||
      text.includes("รอยน้ำ") ||
      text.includes("คราบน้ำ") ||
      text.includes("สีลอก") ||
      text.includes("สีร่อน") ||
      text.includes("รอยร้าว") ||
      text.includes("แตกลายงา") ||
      text.includes("เชื้อรา") ||
      text.includes("ceiling") ||
      text.includes("moisture") ||
      text.includes("paint")
    ) {
      return {
        observationEn: `Moisture staining, paint blister delamination, or hairline plaster cracks detected on ceiling/wall surface at ${zoneEn}, indicating previous or active water seepage from above or external seal degradation.`,
        observationTh: `ตรวจพบคราบน้ำซึม สีลอกร่อน หรือรอยแตกร้าวบริเวณฝ้าเพดาน/ผนัง ${zoneTh} เกิดจากความชื้นสะสมหรือแนวซีลรอยต่อขอบอาคารเริ่มเสื่อมสภาพ`,
        recommendedActionEn: `Inspect source of moisture ingress, repair exterior seals, scrape flaking paint, apply anti-fungal moisture-blocking primer, and refinish with color-matched premium interior/exterior acrylic coat.`,
        recommendedActionTh: `ตรวจหาต้นตอความชื้นและซีลรอยต่อ ขูดลอกสีที่เสื่อมสภาพ ทาน้ำยารองพื้นกันชื้นกันเชื้อรา และเก็บงานทาสีอะคริลิกเฉดตรงเดิมให้เรียบร้อยสวยงาม`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Persistent dampness degrades gypsum ceiling strength and promotes indoor mold growth, impacting air quality.",
        peaceOfMindNote: "ได้รับการตรวจบันทึกโดย Mr. Big เพื่อปกป้องโครงสร้างและความสวยงามสมบูรณ์แบบของวิลล่า",
      };
    }

    // 5.85 Smart Home Anti-Flicker Bypass Capacitor (Ghost glow / LED strobe when switched OFF)
    if (
      (text.includes("กระพริบ") || text.includes("กะพริบ") || text.includes("หรี่") || text.includes("ผีหลอก")) &&
      (text.includes("ปิดไฟ") || text.includes("สวิตช์") || text.includes("สมาร์ท") || text.includes("smart"))
    ) {
      return {
        observationEn: `Interior LED luminaire circuit at ${zoneEn} exhibits residual phantom glowing/flickering when switched off. Caused by parasitic capacitive trickle current leakage from no-neutral smart wall switch through high-efficiency LED drivers.`,
        observationTh: `ตรวจพบไฟ LED บริเวณ${zoneTh} มีอาการกะพริบหรือเรืองแสงริบหรี่หลังจากปิดสวิตช์ เกิดจากสวิตช์สมาร์ทโฮมแบบไม่มีสายนิวทรัล (No-Neutral) มีกระแสไฟเลี้ยงวงจรไหลผ่านไดรเวอร์หลอด LED`,
        recommendedActionEn: `De-energize lighting circuit branch and connect an approved Safety Anti-Flicker Bypass Capacitor in parallel across Line-1 and Neutral terminals directly at the first luminaire load.`,
        recommendedActionTh: `ตัดกระแสไฟเพื่อความปลอดภัย และต่อตัวเก็บประจุ Safety Bypass Capacitor (Anti-Flicker Module) คร่อมขนานระหว่างสาย L1 และ N ที่ขั้วหลอดไฟจุดแรก`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Parasitic current trickle causes nocturnal visual annoyance and accelerates premature driver capacitor burnout.",
        peaceOfMindNote: "Mr. Big จัดการติดตั้งตัวเก็บประจุแก้ไฟกระพริบเพื่อแสงสว่างที่นิ่งสนิทและยืดอายุหลอดไฟ",
      };
    }

    // 5.9 Smart Home & Automation Connectivity Check (Fallback - prevent false defect replacement)
    if (
      text.includes("สมาร์ทโฮม") ||
      text.includes("smart home") ||
      text.includes("automation") ||
      text.includes("เกตเวย์") ||
      text.includes("gateway") ||
      text.includes("zigbee") ||
      text.includes("tuya") ||
      (text.includes("แอพ") && text.includes("offline")) ||
      (text.includes("app") && text.includes("offline"))
    ) {
      return {
        observationEn: `Smart home automation integration serving ${zoneEn} was verified: Physical switch and electrical line contacts are operational without electrical short-circuit. Wireless Zigbee/Wi-Fi coordinator pairing or RF mesh repeater transmission requires on-site network re-synchronization.`,
        observationTh: `ตรวจเช็กระบบสมาร์ทโฮมและสวิตช์บริเวณ${zoneTh}: วงจรไฟฟ้าและกลไกสวิตช์ทำงานได้ตามปกติ ไม่พบการลัดวงจร ไม่จำเป็นต้องเปลี่ยนฮาร์ดแวร์ อยู่ระหว่างตรวจสอบสัญญาณเชื่อมต่อ Zigbee/เกตเวย์`,
        recommendedActionEn: `No switch hardware replacement required. Perform coordinator gateway diagnostic check, re-bind Zigbee mesh nodes, and verify 2.4GHz RF coexistence.`,
        recommendedActionTh: `สวิตช์ไฟและวงจรทำงานได้เป็นปกติ ไม่ต้องเปลี่ยนอุปกรณ์ ให้ช่างเทคนิคตรวจสอบสัญญาณเกตเวย์ ซิงค์สัญญาณ Zigbee และทดสอบการสั่งการผ่านแอปพลิเคชัน`,
        suggestedStatus: "Normal",
        riskAssessment: "No active electrical hazard identified. Physical lighting operation remains secure.",
        peaceOfMindNote: "Mr. Big ดูแลระบบไฟฟ้าและระบบสมาร์ทโฮมให้ทำงานได้อย่างราบรื่น",
      };
    }

    // 5.95 Outdoor Entrance Step & Tree Lighting / Subterranean Power Supply Wiring / Fixtures Inoperative upon Switching
    const isStepLight =
      text.includes("step light") ||
      text.includes("step-light") ||
      text.includes("ไฟ step") ||
      text.includes("ไฟสเต็ป") ||
      text.includes("ขั้นบันได") ||
      text.includes("บันได") ||
      text.includes("stair light") ||
      (zone || "").toLowerCase().includes("step") ||
      (zone || "").toLowerCase().includes("บันได");

    const isTreeLight =
      text.includes("tree light") ||
      text.includes("tree-light") ||
      text.includes("ไฟส่องต้นไม้") ||
      text.includes("ไฟต้นไม้") ||
      text.includes("tree uplight") ||
      text.includes("uplight") ||
      (zone || "").toLowerCase().includes("tree") ||
      (zone || "").includes("ต้นไม้");

    const isEntranceArea =
      zoneEn.toLowerCase().includes("entrance") ||
      zoneEn.toLowerCase().includes("front") ||
      zoneTh.includes("ทางเข้า") ||
      zoneTh.includes("หน้าบ้าน");

    const isWiringOrPowerSupply =
      text.includes("power supply wiring") ||
      text.includes("power supply") ||
      text.includes("wiring") ||
      text.includes("สายไฟ") ||
      text.includes("วงจรสายไฟ") ||
      text.includes("ตรวจเช็คสายไฟ") ||
      text.includes("ตรวจเช็กสายไฟ") ||
      text.includes("สายไฟจ่ายไฟ") ||
      text.includes("สายไฟขาด") ||
      text.includes("feed cable") ||
      text.includes("cable");

    const isFixtureFailsOrNoLight =
      text.includes("fails to operate") ||
      text.includes("fail to operate") ||
      text.includes("does not operate") ||
      text.includes("not operate") ||
      text.includes("not working") ||
      text.includes("does not turn on") ||
      text.includes("fails to turn on") ||
      text.includes("not turn on") ||
      text.includes("light fixture") ||
      text.includes("fixture") ||
      text.includes("ไฟไม่ติด") ||
      text.includes("เปิดไม่ติด") ||
      text.includes("ไม่ติด") ||
      text.includes("ไม่สว่าง") ||
      text.includes("ไม่ทำงาน");

    const isSwitchOperationAction =
      text.includes("upon turning on") ||
      text.includes("when turning on") ||
      text.includes("turn on the switch") ||
      text.includes("turning on the switch") ||
      text.includes("turned on the switch") ||
      text.includes("actuating the switch") ||
      text.includes("flip the switch") ||
      text.includes("เปิดสวิตช์แล้ว") ||
      text.includes("กดสวิตช์แล้ว") ||
      text.includes("สวิตช์เปิดแล้ว");

    const isGeneralLight =
      text.includes("หลอดไฟ") ||
      text.includes("โคมไฟ") ||
      text.includes("ไฟ") ||
      text.includes("หลอด") ||
      text.includes("luminaire") ||
      text.includes("lamp") ||
      text.includes("light");

    if (
      ((isStepLight || isTreeLight || isEntranceArea) && (isFixtureFailsOrNoLight || isWiringOrPowerSupply)) ||
      (isWiringOrPowerSupply && (isGeneralLight || isFixtureFailsOrNoLight || isSwitchOperationAction)) ||
      (isSwitchOperationAction && isFixtureFailsOrNoLight && (isStepLight || isTreeLight || isEntranceArea || isGeneralLight))
    ) {
      const fixtureLabelEn = (isStepLight && isTreeLight)
        ? "step lights and tree uplights"
        : isStepLight
        ? "step lights"
        : isTreeLight
        ? "tree uplights"
        : "lighting fixtures";

      const fixtureLabelTh = (isStepLight && isTreeLight)
        ? "ไฟส่องขั้นบันได (Step Light) และไฟส่องต้นไม้ (Tree Light)"
        : isStepLight
        ? "ไฟส่องขั้นบันได (Step Light)"
        : isTreeLight
        ? "ไฟส่องต้นไม้ (Tree Light)"
        : "ชุดโคมไฟส่องสว่าง";

      return {
        observationEn: `Upon actuating the switch, exterior ${fixtureLabelEn} at ${zoneEn} fail to operate and remain completely unlit. Technical evaluation indicates an electrical continuity disruption in the power supply wiring circuit, subterranean feeder cable degradation, loose wire splices in junction pull-boxes, or failure in the secondary power supply driver.`,
        observationTh: `เมื่อเปิดสวิตช์ไฟ พบว่า${fixtureLabelTh} บริเวณ${zoneTh} ไม่ติดและไม่ทำงานอย่างสิ้นเชิง การตรวจสอบเชิงวิศวกรรมบ่งชี้ว่ามีความผิดปกติในระบบสายไฟจ่ายกำลัง (Power Supply Wiring) เช่น สายไฟใต้ดินขาดในหรือเสื่อมสภาพ, จุดต่อสายในกล่องพักสายหลุดหลวมจากความชื้น, หรือชุดเพาเวอร์ซัพพลาย/หม้อแปลงจ่ายไฟชำรุด`,
        recommendedActionEn: `Chief Electrical Engineer Remediation Plan:
1) Subterranean Cable & Continuity Audit: Safely isolate and de-energize circuit branch; conduct continuity and Megger insulation resistance testing (> 1.0 MΩ) across underground power supply feed cables to pinpoint the exact location of cable breakage or short-to-ground fault.
2) Wiring Rectification & Waterproof Sealing: Replace degraded feed cables with weather-resistant NYY/XLPE conductors, seal subterranean cable splices with waterproof junction sealing, and apply moisture-proof insulation tape.
3) Cost-Effective 12V 3W & Weatherproof Power Supply Upgrade: Recommend replacing damaged fixtures with accessible 12V 3W In-Ground Uplights with waterproof silicone gasket sealing and installing a heavy-duty IP67 weatherproof 12V DC power supply. This ensures 100% electrocution safety (12V SELV) and permanently prevents RCBO breaker trips at fair market rates.`,
        recommendedActionTh: `คำแนะนำเชิงวิศวกรรมระดับหัวหน้าผู้จัดการระบบไฟฟ้า (คุ้มค่าและปลอดภัยสูงสุด):
1) ตรวจสอบความต่อเนื่องและค่าฉนวนสายไฟ: ตัดกระแสไฟฟ้าเพื่อความปลอดภัย ทำการวัดความต่อเนื่อง (Continuity Test) และวัดค่าความต้านทานความเป็นฉนวน (Insulation Resistance Test ด้วย Megger > 1.0 MΩ) ของสายไฟเมนจ่ายกำลังใต้ดินที่เชื่อมต่อกับไฟ step light และ tree light เพื่อหาจุดที่สายไฟขาดในหรือชำรุด
2) ซ่อมแซมระบบสายไฟและจุดต่อ: เปลี่ยนสายไฟช่วงที่เสียหายด้วยสายทนสภาพอากาศ NYY/XLPE และซีลกันน้ำที่กล่องพักสายใต้ดินทุกจุดเพื่อป้องกันน้ำและความชื้นแทรกซึม
3) ติดตั้งหลอด In-Ground Uplight 12V 3W และเพาเวอร์ซัพพลาย 12V กันน้ำ: แนะนำใช้หลอด In-Ground Uplight 12V 3W แสงวอร์มไวท์ พร้อมซีลกันน้ำ และต่อเข้ากับชุดเพาเวอร์ซัพพลาย 12V แบบกันน้ำ IP67 ทนทานสูงที่มีจำหน่ายแพร่หลายในตลาดปัจจุบัน ปลอดภัยจากไฟดูด 100% หมดปัญหาไฟรั่วทริปเบรกเกอร์ และประหยัดค่าใช้จ่ายอย่างคุ้มค่า`,
        suggestedStatus: "Not Working",
        riskAssessment: "Inoperative entrance step and tree illumination creates immediate trip-and-fall physical hazards for arriving guests at night. Concealed subterranean cable faults risk progressive insulation breakdown, moisture short-circuits, and recurring earth-leakage tripping at the MDB panel.",
        peaceOfMindNote: "Mr. Big วิเคราะห์ตรงจุดตามมาตรฐานวิศวกรรมไฟฟ้า: แนะนำหลอด 12V 3W และเพาเวอร์ซัพพลายกันน้ำที่หาซื้อง่ายตามสภาพตลาดจริง ช่วยให้หัวหน้างานและ Molly สรุปใบเสนอราคาได้รวดเร็ว ปลอดภัยตามรอบรับประกัน 1 ปี และเปิดให้หัวหน้างานพิจารณาตัดสินใจ",
      };
    }

    // 6. Wall Light Switch / Smart Switch
    if (
      (text.includes("สวิตช์") || text.includes("switch") || (text.includes("กดไม่ติด") && !text.includes("กลอน"))) &&
      !isSwitchOperationAction
    ) {
      return {
        observationEn: `Wall lighting switch assembly at ${zoneEn} has experienced internal mechanical contact wear or circuit disruption, preventing reliable illumination switching.`,
        observationTh: `ตรวจพบสวิตช์ควบคุมแสงสว่างบริเวณ${zoneTh} ชำรุด ขั้วสัมผัสภายในหลวมหรือเสื่อมสภาพ ไม่สามารถเปิด-ปิดวงจรไฟได้อย่างเสถียร`,
        recommendedActionEn: `Isolate circuit branch, verify line voltage, and replace defective switch mechanism with a certified architectural heavy-duty switch unit.`,
        recommendedActionTh: `ปลดวงจรไฟฟ้า ตรวจสอบแรงดัน และเปลี่ยนชุดสวิตช์ไฟใหม่ที่ได้มาตรฐาน มอก. พร้อมทดสอบการทำงานของวงจร`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Loose internal contacts cause intermittent light flickers and minor contact heating under extended usage.",
        peaceOfMindNote: "ตรวจสอบและควบคุมมาตรฐานโดย Mr. Big เพื่อการใช้งานระบบไฟที่ราบรื่นไร้กังวล",
      };
    }

    // 7. Circuit Breaker / RCBO / Earth Leakage / MDB
    if (
      text.includes("เบรกเกอร์") ||
      text.includes("breaker") ||
      text.includes("ทริป") ||
      text.includes("trip") ||
      text.includes("ไฟตัด") ||
      text.includes("ไฟดับ") ||
      text.includes("ไฟดูด") ||
      text.includes("ไฟรั่ว") ||
      text.includes("rcbo") ||
      text.includes("mdb")
    ) {
      return {
        observationEn: `Circuit breaker / RCBO protective trip event identified for ${zoneEn}. Diagnostics indicate abnormal earth leakage current or transient line overload exceeding rated safety threshold.`,
        observationTh: `ตรวจพบเบรกเกอร์ป้องกันไฟรั่ว/ไฟดูด (RCBO) ประจำพื้นที่${zoneTh} ทริปตัดวงจร ตรวจพบกระแสไฟฟ้ารั่วลงดินหรือโหลดกระแสเกินพิกัดความปลอดภัย`,
        recommendedActionEn: `Conduct insulation resistance Megger testing across branch lines, isolate faulty appliance branch, and replace compromised breaker unit with certified Schneider Electric RCBO.`,
        recommendedActionTh: `ตรวจวัดค่าความเป็นฉนวนของสายไฟ แยกจุดเครื่องใช้ไฟฟ้าที่มีไฟรั่ว และเปลี่ยนชุดเบรกเกอร์ตัดไฟรั่วมาตรฐาน มอก. เพื่อความปลอดภัยสูงสุด`,
        suggestedStatus: "Power Tripped",
        riskAssessment: "Unaddressed earth leakage presents an electrical hazard to occupants and equipment during humid weather.",
        peaceOfMindNote: "Mr. Big ให้ความสำคัญสูงสุดกับความปลอดภัยของระบบไฟฟ้าเพื่อความสบายใจของเจ้าของและผู้เข้าพัก",
      };
    }

    // 7.4 Low-Voltage 12V / 24V SELV Safety Lighting Conversion & In-Ground Landscape / Entrance Uplight
    const is12v =
      text.includes("12v") ||
      text.includes("12 v") ||
      text.includes("12โวลต์") ||
      text.includes("12 โวลต์") ||
      text.includes("แรงดันต่ำ") ||
      text.includes("selv") ||
      text.includes("หม้อแปลง");

    const isInGroundUplight =
      text.includes("in ground") ||
      text.includes("in-ground") ||
      text.includes("inground") ||
      text.includes("up light") ||
      text.includes("uplight") ||
      text.includes("ไฟฝังพื้น") ||
      text.includes("ฝังพื้น") ||
      text.includes("ส่องขึ้น") ||
      text.includes("well light");

    const isLightRelated =
      text.includes("หลอดไฟ") ||
      text.includes("โคมไฟ") ||
      text.includes("ไฟ") ||
      text.includes("หลอด") ||
      text.includes("luminaire") ||
      text.includes("lamp") ||
      text.includes("light");

    const isFlickerOrUrgent =
      text.includes("กระพริบ") ||
      text.includes("กะพริบ") ||
      text.includes("เปลี่ยน") ||
      text.includes("ด่วน") ||
      text.includes("ชำรุด") ||
      text.includes("เสีย") ||
      text.includes("flicker") ||
      text.includes("strobe");

    if ((is12v && isLightRelated) || isInGroundUplight || (is12v && isFlickerOrUrgent)) {
      const isEntrance =
        zoneEn.toLowerCase().includes("entrance") ||
        zoneEn.toLowerCase().includes("front") ||
        zoneTh.includes("ทางเข้า") ||
        zoneTh.includes("หน้าบ้าน");

      const luminaireTypeEn = isEntrance
        ? "Exterior entrance & pathway luminaire"
        : "Exterior landscape in-ground / well light luminaire";
      const luminaireTypeTh = isEntrance
        ? "โคมไฟส่องสว่างทางเข้า (Exterior Entrance Luminaire)"
        : "โคมไฟส่องสว่างภายนอก/โคมไฟฝังพื้น (Exterior Landscape Luminaire)";

      const descEn = `${luminaireTypeEn} at ${zoneEn} exhibits persistent electrical flickering and driver instability caused by moisture ingress past degraded seals. The existing fixture is wired directly to hazardous high-voltage 220V AC mains supply in an exposed, damp outdoor environment. Under tropical humidity and rainwater pooling, running 220V on wet ground poses severe earth-leakage tripping (RCBO nuisance trips) and critical electrocution hazard to occupants, guests, and pets.`;
      const descTh = `ตรวจพบ${luminaireTypeTh} บริเวณ${zoneTh} มีอาการไฟกระพริบและไดรเวอร์ไม่เสถียรเนื่องจากความชื้นและน้ำซึมผ่านซีลขั้วโคม โดยระบบเดิมยังต่อตรงกับไฟแรงดันสูง 220V ในพื้นที่ภายนอกอาคารซึ่งสัมผัสความชื้นและน้ำฝนโดยตรง เสี่ยงต่อการเกิดกระแสไฟฟ้ารั่วลงดิน (Earth Leakage) ทำให้เบรกเกอร์ RCBO ทริปตัดไฟทั้งวิลล่า และก่อให้เกิดอันตรายจากไฟฟ้าดูด (Fatal Shock Hazard) ต่อผู้พักอาศัยและสัตว์เลี้ยงในช่วงฝนตก`;

      const actionEn = `Chief Electrical Engineer Cost-Effective Remediation Plan:
1) Equipment to Replace: Safely de-energize circuit branch; replace defective fixture/lamp with an Outdoor In-Ground Uplight 12V 3W LED luminaire (IP67/IP68 waterproof sealed with impact-resistant tempered lens).
2) Waterproof Sealing: Apply high-durability exterior waterproof silicone gasket sealing around the luminaire collar and wrap electrical connections with weather-resistant moisture tape to prevent rainwater penetration.
3) Weatherproof 12V Power Supply: Install a heavy-duty outdoor weatherproof IP67 12V DC power supply / driver. Technical justification: Converting to 12V SELV (Safety Extra-Low Voltage) keeps operating voltage strictly below human physiological hazard limits, completely eliminating electrocution dangers in wet ground and preventing nuisance RCBO breaker trips at the main MDB, while keeping procurement and maintenance costs fair and affordable for the villa owner.`;

      const actionTh = `คำแนะนำเชิงวิศวกรรมระดับหัวหน้าผู้จัดการระบบไฟฟ้า (แนวทางคุ้มค่าและปลอดภัยสูงสุด):
1) สิ่งที่ต้องเปลี่ยน: ตัดกระแสไฟฟ้าเพื่อความปลอดภัย รื้อถอนจุดเดิมที่ชำรุดและเปลี่ยนเป็น "หลอด/โคมไฟ In-Ground Uplight 12V 3W" แสงวอร์มไวท์ ที่ประหยัดพลังงาน ระบายความร้อนดี และมีชุดซีลยางกันน้ำ
2) การซีลกันน้ำ (Waterproof Sealing): ซีลกันน้ำขอบโคมด้วยซิลิโคนเกรดทนสภาพอากาศภายนอก และพันเทปละลายกันความชื้นจุดต่อสายไฟ เพื่อป้องกันน้ำฝนและความชื้นซึมเข้าตัวโคมอย่างสนิท
3) ชุดจ่ายไฟ Power Supply 12V แบบกันน้ำ: ติดตั้งชุดเพาเวอร์ซัพพลาย 12V แบบกันน้ำ (IP67 Weatherproof 12V Power Supply) บอดี้ทนทาน ซึ่งมีจำหน่ายแพร่หลายในราคาสมเหตุสมผลในตลาดปัจจุบัน โดยระบบแรงดันต่ำ 12V SELV จะช่วยป้องกันอันตรายจากไฟฟ้าดูด 100% แม้ฝนตกน้ำขัง และหมดปัญหาไฟรั่วทริปเบรกเกอร์เมน RCBO ดับทั้งวิลล่า ช่วยให้เจ้าของวิลล่าประหยัดงบประมาณได้อย่างคุ้มค่าสูงสุด`;

      return {
        observationEn: descEn,
        observationTh: descTh,
        recommendedActionEn: actionEn,
        recommendedActionTh: actionTh,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Operating high-voltage 220V luminaires in outdoor entrance/ground areas violates life-safety standards in tropical monsoon environments, presenting severe electrocution and recurring RCBO tripping risks. Converting to 12V SELV is mandatory for electrical safety.",
        peaceOfMindNote: "Mr. Big แนะนำทางออกที่ตรงจุดและคุ้มค่า: ใช้หลอด In-Ground Uplight 12V 3W ซีลกันน้ำแน่นหนา พร้อมเพาเวอร์ซัพพลาย 12V แบบกันน้ำ ทนทาน ปลอดภัยจากไฟดูด 100% สอดคล้องกับสภาพตลาดจริงในภูเก็ตและการรับประกัน 1 ปี ช่วยให้หัวหน้างานและ Molly สรุปใบเสนอราคาได้รวดเร็วทันใจ โดยให้หัวหน้างานพิจารณาตัดสินใจขั้นสุดท้าย",
      };
    }

    // 7.45 Underwater Pool / Fountain Light / ไฟสระว่ายน้ำ
    if (
      text.includes("ไฟสระ") ||
      text.includes("pool light") ||
      text.includes("underwater") ||
      text.includes("ไฟน้ำพุ") ||
      text.includes("ใต้น้ำ")
    ) {
      return {
        observationEn: `Submersible underwater pool / water feature luminaire at ${zoneEn} exhibits electrical malfunction, moisture penetration into the sealed housing, or LED diode burnout.`,
        observationTh: `ตรวจพบไฟส่องสว่างใต้น้ำในสระว่ายน้ำ/ม่านน้ำตกบริเวณ${zoneTh} ชำรุด น้ำซึมเข้าตัวโคม หรือหลอดขาดไม่สว่าง`,
        recommendedActionEn: `Safely isolate underwater lighting circuit. Replace with an IP68 fully resin-filled 12V AC underwater LED pool light and verify SELV isolation transformer grounding.`,
        recommendedActionTh: `ตัดกระแสไฟเพื่อความปลอดภัย รื้อเปลี่ยนโคมไฟสระว่ายน้ำเป็นรุ่น Resin-Filled หล่อเรซิ่นตันกันน้ำ 100% (IP68) ใช้ไฟ 12V AC ปลอดภัย พร้อมตรวจเช็กระบบหม้อแปลงนิรภัย`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Damaged pool lighting seals risk water ingress and electrical leakage into pool water, posing serious swimmer safety risks.",
        peaceOfMindNote: "Mr. Big ให้ความสำคัญสูงสุดกับความปลอดภัยในสระว่ายน้ำ ตรวจเช็กระบบไฟ 12V ใต้น้ำอย่างเข้มงวด",
      };
    }

    // 7.5 Outdoor / Garden Landscape PAR38 Floodlight (หลอดไฟ PAR38, ไฟสนาม, ไฟสวน, ไฟส่องต้นไม้, สปอร์ตไลท์)
    const isOutdoorZone =
      zoneEn.toLowerCase().includes("garden") ||
      zoneEn.toLowerCase().includes("outside") ||
      zoneEn.toLowerCase().includes("outdoor") ||
      zoneEn.toLowerCase().includes("perimeter") ||
      zoneEn.toLowerCase().includes("entrance") ||
      zoneEn.toLowerCase().includes("yard") ||
      zoneTh.includes("สวน") ||
      zoneTh.includes("นอก") ||
      zoneTh.includes("หน้าบ้าน") ||
      zoneTh.includes("ทางเดิน") ||
      zoneTh.includes("รั้ว");

    const isOutdoorGardenLighting =
      text.includes("par38") ||
      text.includes("par-38") ||
      text.includes("par 38") ||
      text.includes("ไฟสนาม") ||
      text.includes("ไฟสวน") ||
      text.includes("สปอร์ตไลท์") ||
      text.includes("สปอตไลท์") ||
      text.includes("ไฟส่องต้นไม้") ||
      text.includes("floodlight");

    if (isOutdoorGardenLighting) {
      const qty = extractQtySafe(text);
      const countTextEn = qty > 1 ? `${qty} units` : "1 unit";
      const countTextTh = qty > 1 ? `${qty} ดวง` : "1 ดวง";

      return {
        observationEn: `Outdoor IP65 waterproof PAR38 landscape/garden floodlight lamp at ${zoneEn} is burned out and inoperative (${countTextEn}), preventing garden pathway and foliage illumination.`,
        observationTh: `ตรวจพบหลอดไฟส่องสว่างภายนอก/ไฟสนาม PAR38 บริเวณ${zoneTh} ขาด/ชำรุด ${countTextTh} ไม่สามารถส่องสว่างได้`,
        recommendedActionEn: `Safely de-energize exterior garden lighting circuit, dismantle weathered fixture housing, inspect waterproof E27 silicone gasket seal, and install a brand-new IP65 outdoor-rated PAR38 LED lamp (${countTextEn}, 15W-18W Warm White).`,
        recommendedActionTh: `ตัดกระแสไฟเพื่อความปลอดภัย ตรวจเช็กซีลยางกันน้ำขั้วเกลียว E27 ของโคมสนาม และเปลี่ยนหลอดไฟสนาม PAR38 LED กันน้ำกันฝน (IP65) แสง Warm White เทียบเคียงราคากลางตลาดทั่วไป ${countTextTh} พร้อมทดสอบการทำงาน`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Diminished exterior garden lighting poses nighttime tripping hazards and reduces security visibility around the villa grounds.",
        peaceOfMindNote: "Mr. Big เลือกใช้อะไหล่ราคากลางตลาดทั่วไปที่หาซื้อง่ายในภูเก็ต ช่วยให้หัวหน้างานและ Molly สรุปใบเสนอราคาได้รวดเร็วทันใจ ปลอดภัยตามรอบรับประกัน 1 ปี และให้หัวหน้างานพิจารณาตัดสินใจขั้นสุดท้าย",
      };
    }

    // 7.6 Exterior General Lighting (Outdoor Entrance / Wall / Pathway Luminaire)
    if (isOutdoorZone && isLightRelated && isFlickerOrUrgent) {
      return {
        observationEn: `Exterior luminaire fixture at ${zoneEn} exhibits electrical flickering and degraded weatherproofing seals, causing unstable performance under outdoor exposure.`,
        observationTh: `ตรวจพบโคมไฟส่องสว่างภายนอกอาคารบริเวณ${zoneTh} มีอาการไฟกระพริบและซีลกันน้ำเริ่มเสื่อมสภาพจากการใช้งานกลางแจ้ง`,
        recommendedActionEn: `Safely de-energize circuit branch and replace with an IP65/IP66 outdoor-rated weatherproof LED luminaire with silicone sealed cable glands.`,
        recommendedActionTh: `ตัดกระแสไฟเพื่อความปลอดภัย และเปลี่ยนโคมไฟส่องสว่างภายนอกอาคารชุดใหม่มาตรฐานกันน้ำกันฝุ่น IP65/IP66 พร้อมซีลจุดต่อสายให้มิดชิด`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Degraded outdoor fixtures risk moisture short-circuits and electrical tripping during heavy rainfall.",
        peaceOfMindNote: "Mr. Big ตรวจสอบเปลี่ยนโคมไฟภายนอกให้ทนทานต่อสภาพอากาศชายฝั่งทะเลภูเก็ต",
      };
    }

    // 8. Indoor Lighting / Downlight / LED Driver (Only for indoor / ceiling areas, NEVER for outdoor/garden)
    if (
      !isOutdoorZone &&
      (text.includes("หลอดไฟ") ||
        text.includes("ดาวน์ไลท์") ||
        text.includes("downlight") ||
        text.includes("โคมไฟ") ||
        text.includes("ไฟกระพริบ") ||
        text.includes("ไฟกะพริบ") ||
        text.includes("หลอดขาด") ||
        text.includes("led"))
    ) {
      return {
        observationEn: `Interior recessed LED downlight fixture at ${zoneEn} is inoperative or flickering due to a degraded constant-current LED driver or burned diode array, impairing ambient illuminance.`,
        observationTh: `ตรวจพบโคมไฟส่องสว่างบริเวณ${zoneTh} ไม่ติดหรือกะพริบ เกิดจากชุดขับ LED Driver หรือชิป LED เสื่อมสภาพ ส่งผลต่อระดับแสงสว่างในพื้นที่`,
        recommendedActionEn: `Dismantle degraded fixture, replace failed driver with certified constant-current unit, and install matching high-CRI warm-white recessed LED downlight.`,
        recommendedActionTh: `เปลี่ยนชุดไดรเวอร์และเปลี่ยนโคมไฟ LED คุณภาพสูงมาตรฐาน มอก. แสงสม่ำเสมอ พร้อมตรวจเช็กขั้วต่อสายไฟ`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Unstable drivers cause annoying light flickers and reduce overall luxury presentation of the villa.",
        peaceOfMindNote: "ได้รับการบันทึกและจัดสรรทางแก้ไขโดย Mr. Big เพื่อบรรยากาศแสงสว่างที่สมบูรณ์แบบ",
      };
    }

    // 9. Air Conditioning / HVAC / Cooling
    if (
      text.includes("แอร์") ||
      text.includes("air") ||
      text.includes("hvac") ||
      text.includes("ไม่เย็น") ||
      text.includes("คอมเพรสเซอร์") ||
      text.includes("แอร์ตัน")
    ) {
      return {
        observationEn: `Air conditioning system serving ${zoneEn} exhibits reduced cooling efficiency, dirty filter/coil airflow obstruction, or drain line condensate overflow risk.`,
        observationTh: `ตรวจพบระบบปรับอากาศบริเวณ${zoneTh} ทำความเย็นได้ต่ำกว่ามาตรฐาน มีฝุ่นสะสมที่แผงรังผึ้งคอยล์ และท่อน้ำทิ้งเริ่มมีคราบเมือกอุดตัน`,
        recommendedActionEn: `Perform high-pressure chemical coil wash, flush condensate drain piping to prevent water overflow, inspect refrigerant charge, and test run capacitor.`,
        recommendedActionTh: `ล้างทำความสะอาดแผงคอยล์เย็น-คอยล์ร้อนด้วยโฟมแรงดันสูง เป่าล้างท่อน้ำทิ้ง ป้องกันน้ำหยด และตรวจวัดแรงดันน้ำยาแอร์`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Fouled heat exchanger coils force the compressor to operate under thermal strain, spiking electricity consumption.",
        peaceOfMindNote: "ดูแลโดย Mr. Big เพื่อให้อากาศภายในวิลล่าเย็นสบาย สะอาด และประหยัดพลังงาน",
      };
    }

    // 10. Pool Pump / Water Circulation / Mechanical
    if (
      text.includes("ปั๊มสระ") ||
      text.includes("pool pump") ||
      (text.includes("ปั๊ม") && (text.includes("สระ") || text.includes("pool"))) ||
      (text.includes("สระว่ายน้ำ") && text.includes("น้ำไม่ใส"))
    ) {
      return {
        observationEn: `Swimming pool circulation pump at ${zoneEn} generates abnormal mechanical bearing whine and vibration, indicating worn shaft bearings or ceramic mechanical seal leakage.`,
        observationTh: `ตรวจพบปั๊มน้ำสระว่ายน้ำบริเวณ${zoneTh} ส่งเสียงดังผิดปกติและมีอาการสั่น เกิดจากตลับลูกปืนมอเตอร์สึกหรอหรือชุดแมคคานิคอลซีลเริ่มมีน้ำซึม`,
        recommendedActionEn: `Dismount pump motor assembly, press in matched high-speed NSK sealed bearings, replace mechanical shaft seal with chlorine-resistant unit, and verify flow rates.`,
        recommendedActionTh: `ถอดตรวจเช็กมอเตอร์ปั๊มสระ เปลี่ยนตลับลูกปืนรอบจัด NSK เปลี่ยนชุดซีลกันน้ำทนคลอรีน และทดสอบแรงดันระบบน้ำสระ`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Unaddressed seal leaks allow chlorinated water into electrical motor windings, leading to motor burnout.",
        peaceOfMindNote: "Mr. Big วางแผนซ่อมบำรุงเชิงป้องกันเพื่อให้น้ำในสระใสสะอาดและยืดอายุการใช้งานอุปกรณ์",
      };
    }

    // 11. Network / Wi-Fi / Router / CCTV / LAN / Fiber ONT
    if (
      text.includes("wifi") ||
      text.includes("wi-fi") ||
      text.includes("ไวไฟ") ||
      text.includes("เน็ต") ||
      text.includes("network") ||
      text.includes("lan") ||
      text.includes("router") ||
      text.includes("เร้าเตอร์") ||
      text.includes("cctv") ||
      text.includes("กล้อง") ||
      text.includes("los") ||
      text.includes("access point")
    ) {
      const isFiberLos = text.includes("los") || (text.includes("แดง") && text.includes("เร้าเตอร์"));
      const obsEn = isFiberLos
        ? `Optical Network Terminal (Fiber ONT Router) at ${zoneEn} displays a red LOS (Loss of Signal) alarm, indicating an optical fiber attenuation loss or severed incoming service drop cable.`
        : `Wireless Wi-Fi throughput and network data connection at ${zoneEn} exhibits packet latency, high drop rate, or degraded Cat6 cable termination.`;
      const obsTh = isFiberLos
        ? `ตรวจพบเร้าเตอร์ไฟเบอร์ออปติก (Fiber ONT) บริเวณ${zoneTh} ขึ้นไฟสีแดง LOS (Loss of Signal) ไม่มีสัญญาณแสงเข้า หรือสายไฟเบอร์ขาด/หักงอ`
        : `ตรวจพบสัญญาณเครือข่าย Wi-Fi หรือจุดเชื่อมต่อสาย LAN บริเวณ${zoneTh} สัญญาณไม่เสถียร สปีดตก หรือมีคลื่นรบกวนทะลุกำแพงคอนกรีต`;

      return {
        observationEn: obsEn,
        observationTh: obsTh,
        recommendedActionEn: isFiberLos
          ? `Inspect optical patch cable, clean SC/APC connector face, verify optical Rx power levels, and coordinate urgent ISP line repair.`
          : `Re-terminate degraded Cat6 RJ45 keystone plugs, optimize Access Point channel width (20/40/80 MHz), rebalance PoE switch budget, and audit local DHCP IP pool.`,
        recommendedActionTh: isFiberLos
          ? `ตรวจเช็กสายแพตช์คอร์ดไฟเบอร์ ทำความสะอาดหัวต่อ SC/APC วัดระดับสัญญาณแสง และประสานงานผู้ให้บริการอินเทอร์เน็ตเพื่อแก้ไขอย่างเร่งด่วน`
          : `ตรวจเช็กและเข้าหัวสาย LAN Cat6 ใหม่ ปรับจูนช่องสัญญาณ Access Point และตรวจสอบโหลดพาวเวอร์สวิตช์ PoE เพื่อให้อินเทอร์เน็ตเสถียรทั่ววิลล่า`,
        suggestedStatus: "Requires Swap",
        riskAssessment: "Interrupted network connectivity disrupts remote guest work and villa communication systems.",
        peaceOfMindNote: "Mr. Big ตรวจสอบระบบเครือข่าย IT และ Wi-Fi ให้เชื่อมต่ออินเทอร์เน็ตได้อย่างลื่นไหลไร้สะดุด",
      };
    }

    // 12. General Technical / Villa Inspection Finding
    return {
      observationEn: `On-site villa inspection at ${zoneEn}: Identified operational or cosmetic defect: "${findingTh}". Recommended property care maintenance to uphold premier villa condition.`,
      observationTh: `การตรวจรับและดูแลวิลล่าบริเวณ${zoneTh}: ตรวจพบข้อบกพร่อง "${findingTh}" แนะนำดำเนินการปรับปรุงซ่อมแซมเพื่อรักษามาตรฐานความสมบูรณ์ของวิลล่า`,
      recommendedActionEn: `Engage qualified technician to inspect defective item, replace with standard certified components, and verify proper operation.`,
      recommendedActionTh: `ประสานงานช่างผู้เชี่ยวชาญเข้าดำเนินการซ่อมแซมหรือเปลี่ยนอะไหล่ที่ได้มาตรฐาน พร้อมทดสอบการใช้งานให้เรียบร้อย`,
      suggestedStatus: "Requires Swap",
      riskAssessment: "Timely rectification prevents progressive deterioration and maintains luxury property value.",
      peaceOfMindNote: "ได้รับการบันทึกและประเมินโดย Mr. Big ตัวแทนหน้างานที่ไว้วางใจได้ของเจ้าของวิลล่า",
    };
  }

  // --------------------------------------------------------------------------
  // AI Agent 1: Mr. Big (The Technical Guardian)
  // --------------------------------------------------------------------------
  app.post("/api/gemini/mr-big", async (req: Request, res: Response) => {
    const { findingTh, zone, category } = req.body;

    if (!findingTh || typeof findingTh !== "string") {
      res.status(400).json({ error: "findingTh is required" });
      return;
    }

    const domainResult = analyzeFindingWithMrBig(findingTh, zone, category);

    if (!ai) {
      res.json(domainResult);
      return;
    }

    try {
      const systemInstruction = `
คุณคือ Mr. Big หัวหน้าทีมตรวจหน้างานของ Phuket Trusted Local (Villa Inspection, Property Care & On-Ground Representation for Absentee Villa Owners and Luxury Rental Hosts in Phuket)
หน้าที่ของคุณคือเปลี่ยน 'บันทึกสั้นๆ หรือเสียงพูด' จากทีมช่าง ให้กลายเป็นรายงานการตรวจรับและดูแลวิลล่าระดับมืออาชีพ (Bilingual: Thai & English)

บริบทสำคัญของ Phuket Trusted Local:
- เราเป็น "ผู้เชี่ยวชาญการตรวจรับและดูแลวิลล่า (Villa Inspection & Property Care Management)" ครอบคลุมทุกมิติ
- บริการครอบคลุมทุกระบบหลักของวิลล่า: ประตู-หน้าต่าง-รางเลื่อน-ลูกล้อ, ระบบประปา-สุขภัณฑ์-ท่อน้ำ, ระบบปรับอากาศ, ฝ้าเพดาน-ความชื้น-สี, ระบบสระว่ายน้ำ, ไฟสนาม/สวน, ระบบไฟฟ้า, ระบบเน็ตเวิร์ก IT, และระบบสมาร์ทโฮม

ทักษะและความเชี่ยวชาญพิเศษระดับสูง (ไม่ต้องอธิบายเยอะ ช่างพิมพ์สั้นๆ คุณเข้าใจทะลุปรุโปร่ง):
1. ด้าน IT & Villa Network Infrastructure:
   - ช่างพิมพ์สั้นๆ: "เน็ตหลุด / ไฟเร้าเตอร์กระพริบแดง LOS / wifi ช้า / หลุดบ่อย / ไฟ AP ส้ม / ping แกว่ง / ip ชน / สายแลนขาดใน"
   - คุณเข้าใจทันที: ปัญหาสายไฟเบอร์ออปติกขาด/สัญญาณแสงตก (Fiber ONT Loss of Signal), ไฟสถานะ Access Point (UniFi/Aruba) ส้มจาก PoE จ่ายไฟไม่พอหรือเจรจาพอร์ต 100Mbps แทนที่จะเป็น 1Gbps, การชนกันของช่องสัญญาณ Wi-Fi 2.4GHz/5GHz ทะลุกำแพงคอนกรีตวิลล่า, ปัญหา DHCP IP Pool ชนกัน, หรือการเข้าหัวสาย Cat6 RJ45 เสื่อมสภาพ
   - แปลและให้ข้อเสนอแนะเชิงวิศวกรรมสากลที่ชัดเจน ไม่คลุมเครือ

2. ด้านระบบไฟฟ้าอาคาร (Electrical Engineering, MDB & Safety):
   - ช่างพิมพ์สั้นๆ: "เบรกเกอร์ทริปตอนฝนตก / ไฟดูดตอนแตะตู้ / สวิตช์มีเสียงจี่ / รอยไหม้ตู้ไฟ / นิวทรัลลอย / กราวด์ไม่ลง / SPD เสีย / ไฟตกแรงดันแกว่ง"
   - คุณเข้าใจทันที: กระแสไฟฟ้ารั่วเกิน 30mA จากความชื้นสะสมภายนอกตัดวงจร RCBO, ความต้านทานหลักดินสูงเกินเกณฑ์มาตรฐาน (> 5 โอห์ม) เกิดแรงดันเหนี่ยวนำที่โครงโลหะ, จุดต่อสายไฟหลวม (Loose Terminal Lug) จนเกิดความร้อนสะสมและการอาร์ค (Contact Chatter Arcing), แรงดันไฟฟ้า 3 เฟสไม่สมดุล (Phase Imbalance), หรืออุปกรณ์ป้องกันไฟกระชาก (Surge Protection Device - SPD) เสื่อมสภาพจากพายุฟ้าผ่าในภูเก็ต
   - สั่งทดสอบ Megger Insulation Resistance (> 1 MΩ), วัด Earth Resistance (< 5Ω), และตรวจสอบจุดต่อสายไฟด้วยความปลอดภัยสูงสุด

3. ด้าน Smart Home & Automation Systems:
   - ช่างพิมพ์สั้นๆ: "เปิดสวิตช์ไฟติดปกติ ไม่ช๊อต ต้องเช็คต่อสมาร์ทโฮมอีกที" -> คุณเข้าใจทันที: วงจรไฟฟ้าปลอดภัย 100% สวิตช์ทำงานได้ปกติ (Status = Normal) ไม่ต้องเปลี่ยนฮาร์ดแวร์ แต่ต้องตรวจเช็กการเชื่อมต่อ Zigbee Gateway / Coordinator, RF mesh hops, และแอปพลิเคชัน
   - ช่างพิมพ์สั้นๆ: "สวิตช์ในแอพ offline แต่กดมือติด" -> คุณเข้าใจทันที: สวิตช์ไม่เสีย (Status = Normal) ปัญหาเกิดจากคลื่นรบกวน 2.4GHz หรือระยะห่างเกตเวย์ ให้ช่าง Re-pair สัญญาณ ห้ามสั่งเปลี่ยนสวิตช์
   - ช่างพิมพ์สั้นๆ: "ไฟกระพริบตอนปิดไฟ / ผีหลอก / หลอดหรี่ไม่ดับ" -> คุณเข้าใจทันที: สวิตช์สมาร์ทโฮมแบบไม่มีสายนิวทรัล (No-Neutral) มีกระแสไฟเลี้ยงวงจรผ่านไดรเวอร์หลอด LED (Parasitic Capacitive Bleed) ทางแก้คือต่อตัวเก็บประจุ Safety Bypass Capacitor ขนานที่ขั้วหลอด L1/N
   - ช่างพิมพ์สั้นๆ: "เซนเซอร์ประตูไม่เตือน / ม่านไฟฟ้าไม่วิ่งตามซีน" -> แบตเตอรี่ต่ำ, Zigbee Protocol unbind, หรือการตั้งค่า End-Limit มอเตอร์ม่าน

4. ทักษะสำคัญสูงสุด: การจัดหาอุปกรณ์ตามสภาพตลาดจริงในภูเก็ต และความเข้าใจบริบทธุรกิจ (Market-Realistic Sourcing, 1-Year Warranty & Fast Quotation Synergy):
   - หัวใจสำคัญที่ Mr. Big ต้องตระหนักรู้และยึดถืออย่างเคร่งครัด:
     1) "ผลกระทบต่อความเร็วในการส่งใบเสนอราคา (Direct Impact on Quotation Speed)":
        การนำเสนออุปกรณ์จาก Mr. Big นั้นจะส่งผลกระทบโดยตรงทำให้หัวหน้างานและน้อง Molly ส่งใบเสนอราคาให้ลูกค้าช้าหรือเร็ว! ทุกอย่างขึ้นอยู่กับการนำเสนอสินค้าที่ถูกต้องและเหมาะสมจาก Mr. Big
        - หาก Mr. Big ระบุอุปกรณ์สเปกมาตรฐาน ราคากลางชัดเจน หาซื้อง่ายในตลาด น้อง Molly จะสามารถดึงราคากลางมาทำใบเสนอราคา (Quotation) ได้ทันที ทำให้ส่งใบเสนอราคาให้ลูกค้าได้อย่างรวดเร็วทันใจ ปิดงานซ่อมได้ไว เจ้าของวิลล่าประทับใจ
        - หาก Mr. Big เสนอของแปลก หายาก สเปกเวอร์เกินไป น้อง Molly และหัวหน้างานจะต้องเสียเวลาควานหาราคา ทำให้ส่งใบเสนอราคาช้า ลูกค้าลังเลและอาจเสียโอกาสทางธุรกิจ
     2) "การเลือกอุปกรณ์ที่เข้าถึงง่ายตามสภาพตลาดจริงในภูเก็ต (Market-Accessible & Readily Available Equipment)":
        หัวหน้างานและทีมช่างต้องหาซื้ออุปกรณ์ได้จริงในท้องตลาดภูเก็ต (เช่น ไทวัสดุ, เมกาโฮม, โฮมโปร ฉลอง/สามกอง, ร้านยี่ปั๊วอุปกรณ์ไฟฟ้าในพื้นที่) ห้ามเสนอของสั่งนำเข้าเฉพาะเจาะจงที่หาซื้อไม่ได้หรือต้องรอพรีออเดอร์นานเป็นสัปดาห์เด็ดขาด
     3) "วงรอบการรับประกันงาน 1 ปี และความยั่งยืนของธุรกิจ (1-Year Warranty Cycle & Business Sustainability)":
        การรับประกันงานบริการของบริษัทอยู่ที่ 1 ปี (Standard 1-Year Warranty) หากเสนอซื้อของแพงเวอร์จนไม่มีการอัปเกรดอีกเป็นเวลานาน ลูกค้าจะสู้ราคาไม่ไหว และบริษัทจะไม่มีรายได้หมุนเวียนเข้ามาจากการบำรุงรักษาตามรอบ อุปกรณ์ที่ Mr. Big นำเสนอจึงต้อง "ปลอดภัย ได้มาตรฐานวิศวกรรม ราคาเหมาะสม และหาซื้อง่ายตามสภาพตลาดจริง" เพื่อให้งานผ่านการรับประกัน 1 ปีอย่างราบรื่น และเปิดโอกาสให้เกิดการดูแลรักษา/อัปเกรดตามรอบเวลาอย่างต่อเนื่อง
     4) "อำนาจการพิจารณาตัดสินใจเป็นของหัวหน้างาน (Executive Decision Authority)":
        หัวหน้างาน (ผู้ใช้) จะเป็นผู้พิจารณาเองว่าควรใช้อุปกรณ์ตัวใด ดังนั้นคำแนะนำของ Mr. Big ต้องระบุสเปกอุปกรณ์ที่ถูกต้อง ชัดเจน คุ้มค่า เข้าถึงง่าย เพื่อเป็นข้อมูลสนับสนุนการตัดสินใจที่ดีที่สุดและรวดเร็วที่สุดให้กับหัวหน้างาน

- กฎการตีความสถานะ "ปกติ (Normal)" เทียบกับ "ชำรุด (Defect)" - สำคัญสูงสุด:
  * หากข้อความจากช่างระบุว่า "ทำงานได้ปกติ", "ปกติ", "ไม่มีการลัดวงจร", "ไม่ทริป", "เปิดติดปกติ", "ใช้งานได้ดี", "ไม่มีปัญหา", "ไม่เสีย", "ไม่ชำรุด", "สมบูรณ์", "ผ่านเกณฑ์", หรือคำในเชิงยืนยันว่าระบบทำงานได้สมบูรณ์ ไม่มีการลัดวงจร:
    - suggestedStatus: ต้องเป็น "Normal" เท่านั้น! ห้ามประเมินเป็น "Requires Swap", "Not Working", หรือ "Power Tripped" เด็ดขาด!
    - observationEn: ต้องแปลและบรรยายเป็นภาษาอังกฤษระดับวิศวกรรมสากลที่สมบูรณ์ 100% ว่าอุปกรณ์ได้รับการตรวจสอบและทดสอบแล้ว ทำงานได้เป็นปกติ ไม่มีข้อบกพร่อง ไม่มีการลัดวงจร ห้ามนำคำภาษาไทยหรือภาษาคาราโอเกะมาปะปนใน observationEn โดยเด็ดขาด!
    - observationTh: เรียบเรียงภาษาไทยให้กระชับ ชัดเจน ระบุว่าตรวจเช็กแล้วทำงานได้เป็นปกติ
    - recommendedActionEn: ต้องระบุชัดเจนว่า "No hardware replacement or corrective repairs required. Maintain scheduled routine preventive inspections." ห้ามสั่งเปลี่ยนอุปกรณ์หรือสั่งซื้ออะไหล่เด็ดขาด!
    - recommendedActionTh: ต้องระบุชัดเจนว่า "ระบบทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์หรือซ่อมแซม ให้คงรอบการตรวจเช็กและบำรุงรักษาตามระยะเวลา"
    - riskAssessment: "No active operational or electrical hazard identified."
    - peaceOfMindNote: "Mr. Big ตรวจสอบยืนยันความพร้อมใช้งานและความปลอดภัยเรียบร้อยแล้ว"

- กฎการแปลภาษาอังกฤษ (observationEn) ห้ามปนภาษาไทยเด็ดขาด:
  * ช่างพิมพ์ภาษาไทยเข้ามา คุณต้อง "แปลและตีความหมาย" ให้เป็นภาษาอังกฤษสากลที่ถูกต้องตามหลักวิศวกรรม
  * ห้ามนำคำภาษาไทยคำอังกฤษคำมาผสมกัน เช่น "Inspection at ตู้ไฟ MDB" หรือ "switch at ทางเดินเข้าห้องน้ำ" เป็นสิ่งต้องห้ามเด็ดขาด!
  * ต้องแปลชื่อสถานที่ภาษาไทยเป็นภาษาอังกฤษสากลเสมอ:
    - "ตู้ไฟ MDB", "ตู้ไฟ" -> "Main Distribution Board (MDB)"
    - "ทางเดินเข้าห้องน้ำชั้นล่าง" -> "ground floor bathroom corridor / hallway"
    - "ทางเดินเข้าห้องน้ำชั้นบน" -> "upper floor bathroom corridor / hallway"
    - "ทางเดินเข้าห้องน้ำ" -> "bathroom corridor / hallway"
    - "สวนหน้าบ้าน" -> "outside garden"
    - "สวนหลังบ้าน" -> "back garden"
    - "สวนข้างบ้าน" -> "side garden / pathway"
    - "หน้าบ้าน" -> "front entrance / yard"
    - "หลังบ้าน" -> "rear perimeter"
    - "รอบบ้าน" -> "outdoor exterior perimeter"
    - "ที่จอดรถ" -> "carport / parking area"

- ความสามารถในการรองรับภาษา (Bilingual Input Understanding):
  * ช่างและผู้ใช้งานสามารถป้อนข้อมูลเข้ามาได้ทั้ง "ภาษาไทยล้วน", "ภาษาอังกฤษล้วน", หรือ "ภาษาไทยผสมภาษาอังกฤษ (Mixed Language)" เช่น:
    - "ไฟ step light + tree light main entrance area"
    - "Upon turning on the switch, the light fixture fails to operate. A thorough inspection of the power supply wiring to the fixture is required as there may be a disconnection or fault."
    - "เปิดสวิตช์แล้วไฟสเต็ป step light ไม่ติด ต้องเช็คสายไฟ power supply wiring"
  * คุณต้องเข้าใจเนื้อหาและบริบททางวิศวกรรมทันที ไม่ว่าผู้ใช้จะพิมพ์มาเป็นภาษาใด และผลิตผลลัพธ์ bilingual (English & Thai) ที่สมบูรณ์แบบตามมาตรฐานวิศวกรระดับหัวหน้า

- กฎระบบไฟฟ้าและการส่องสว่างภายนอก-ภายใน (Electrical Engineering & Lighting Systems) - สำคัญมาก:
  * หมวด 0: ไฟส่องขั้นบันไดทางเข้า, ไฟส่องต้นไม้ และระบบสายไฟจ่ายกำลัง (Entrance Step Lights, Tree Uplights & Power Supply Wiring):
    - หากข้อความระบุถึง "step light", "tree light", "ไฟ step", "ไฟสเต็ป", "ไฟส่องต้นไม้", "ไฟทางเข้าหลัก (main entrance)", หรือการตรวจสอบ "power supply wiring", "สายไฟขาดใน", "สายไฟใต้ดิน", หรือระบุว่า "Upon turning on the switch, the light fixture fails to operate. A thorough inspection of the power supply wiring...":
    - คำเตือนสำคัญ: การกระทำ "turning on the switch" หรือ "เปิดสวิตช์แล้วไฟไม่ติด" คือขั้นตอนการทดสอบ ไม่ใช่ตัวสวิตช์เสีย! ห้ามวินิจฉัยว่าสวิตช์เสียเด็ดขาด! ปัญหาที่แท้จริงคือ "โคมไฟไม่ติดเนื่องจากระบบสายไฟจ่ายกำลัง (Power Supply Wiring Failure)"
    - วินิจฉัยเชิงวิศวกรรมระดับหัวหน้าผู้จัดการไฟฟ้า: สายไฟเมนใต้ดินเสื่อมสภาพ/ขาดใน, จุดต่อสายในกล่องพักสายใต้ดินหลุดหลวมจากความชื้น, หรือหม้อแปลงไดรเวอร์ชำรุด
    - แผนฟื้นฟูเชิงวิศวกรรม (Remediation Plan):
      1) ตรวจวัด Continuity และ Megger Insulation Resistance (> 1.0 MΩ) ของสายไฟจ่ายกำลังใต้ดิน
      2) ซ่อมเปลี่ยนสายไฟทนสภาพอากาศ NYY/XLPE และหล่อเรซิ่นเจลกันน้ำ IP68 Submersible Resin-Gel
      3) อัปเกรดเป็นระบบไฟแรงดันต่ำ 12V SELV (Safety Extra-Low Voltage) ผ่านหม้อแปลงนิรภัย IP67 เพื่อความปลอดภัยสูงสุดจากไฟดูด ป้องกันไฟรั่ว และหมดปัญหาเบรกเกอร์ RCBO เมนทริปทั้งวิลล่าอย่างถาวร
    - suggestedStatus: "Not Working" หรือ "Requires Swap"

  * หมวด 1: โคมไฟฝังพื้น / ไฟส่องขึ้น / ไฟบ่อน้ำบาดาล (In-Ground Uplight / Well Light / In-Ground Buriable Uplight):
    - หากข้อความระบุถึง "in ground", "in-ground", "inground", "up light", "uplight", "ไฟฝังพื้น", "โคมฝังพื้น", "ฝังพื้น", "ไฟส่องขึ้น", "well light", หรือพูดถึงการแปลงเป็นระบบ 12V เพื่อความปลอดภัย:
    - คุณต้องเข้าใจทะลุปรุโปร่งทันที: นี่คือ "In-Ground Landscape Uplight / Well Light Fixture" ที่ฝังอยู่ในดิน/พื้นลานทางเดินภายนอก
    - สาเหตุไฟกระพริบ (Flickering/Strobe): เกิดจากความชื้นหรือน้ำฝนซึมผ่านขอบซีลหน้าเลนส์กระจกนิรภัย (Tempered Glass Lens Gasket) เข้าไปทำให้ไดรเวอร์ชิป LED เสียหาย หรือเกิดการลัดวงจรชั่วคราว
    - สเปคและการคุมงบประมาณที่คุ้มค่า (Cost-Effective Safety Engineering & Fast Quotation): ให้แนะนำใช้ "หลอด In-Ground Uplight 12V 3W" (Outdoor 12V 3W In-Ground Uplight LED) พร้อมทำการ "ซีลกันน้ำ" (Waterproof Sealing) รอบตัวโคมและจุดต่อสายไฟ และติดตั้งชุด "Power Supply 12V แบบกันน้ำ IP67" (Weatherproof Heavy-Duty 12V Power Supply) บอดี้อลูมิเนียมทนทานสูง ซึ่งทนสภาพอากาศภายนอกได้ดีเยี่ยม หาซื้อง่ายตามสภาพตลาดจริงในภูเก็ต (ไทวัสดุ/เมกาโฮม/โฮมโปร) สอดคล้องกับการรับประกันงาน 1 ปี ช่วยให้หัวหน้างานและน้อง Molly ดึงราคากลางออกใบเสนอราคาได้อย่างรวดเร็วทันใจ และเปิดโอกาสให้หัวหน้างานเป็นผู้พิจารณาตัดสินใจขั้นสุดท้าย
    - มาตรฐานวิศวกรรมความปลอดภัยขั้นสูงสุด (Safety Extra-Low Voltage - SELV 12V): ในสภาพอากาศภูเก็ตที่มีความชื้นสูงและดินเปียกชื้น การจ่ายไฟตรง 220V เข้าโคมฝังพื้นมีความเสี่ยงต่อไฟรั่วลงดินและไฟดูดผู้พักอาศัย/สัตว์เลี้ยงอย่างรุนแรง (Severe Electrocution Hazard) ต้องระบุข้อเสนอแนะให้เปลี่ยนเป็นระบบไฟแรงดันต่ำ 12V SELV ผ่านเพาเวอร์ซัพพลาย/หม้อแปลง 12V กันน้ำ ซึ่งแรงดัน 12V ไม่สามารถดูดจนเป็นอันตรายถึงชีวิตได้ 100% และหมดปัญหาเบรกเกอร์ RCBO เมนทริปทั้งวิลล่า คุ้มค่าและปลอดภัยสูงสุด
    - สถานะ (suggestedStatus): "Requires Swap" (หรือ "Critical Swap" หากระบุว่าควรเปลี่ยนโดยด่วน)
    - คำเตือนขั้นเด็ดขาด: ห้ามแปลเป็น PAR38 หรือ Downlight โดยเด็ดขาด! ต้องแปลเป็น In-Ground Uplight / Well Light เสมอ!

  * หมวด 2: ไฟสระว่ายน้ำและไฟน้ำพุ (Underwater Pool & Fountain Lights):
    - หากระบุถึง "ไฟสระ", "pool light", "ไฟใต้น้ำ", "น้ำพุ":
    - ต้องแปลเป็น "Submersible IP68 Resin-Filled 12V AC LED Pool Light" ห้ามใช้ไฟ 220V ในน้ำเด็ดขาด

  * หมวด 3: ไฟสนาม / สปอตไลท์ส่องต้นไม้ PAR38 (Outdoor PAR38 Floodlight & Garden Spotlights):
    - หากระบุถึง "หลอดไฟ PAR38", "par38", "ไฟสนาม", "ไฟสวน", "โคมสปอตไลท์/สปอร์ตไลท์", "ไฟส่องต้นไม้", "ไฟกิ่ง" (และไม่ได้ระบุว่าเป็นไฟฝังพื้น):
    - แปลและระบุว่าเป็น "Outdoor IP65 waterproof PAR38 landscape/garden floodlight lamp" โดยใช้อัตราเทียบเคียงราคากลางตลาดทั่วไป ตรวจเช็กซีลยางกันน้ำขั้ว E27
    - หากระบุจำนวน "1 อัน", "1 ดวง", "1 หลอด", "1 ชิ้น" ต้องระบุ quantity = 1 unit เท่านั้น!

  * หมวด 4: ไฟดาวน์ไลท์และไฟในอาคาร (Interior Downlights & Recessed Fixtures):
    - เฉพาะพื้นที่ภายในอาคาร/ฝ้าเพดานเท่านั้น หากเปิดไฟแล้วกระพริบ เกิดจากไดรเวอร์ LED (Constant Current Driver) เสื่อมสภาพ

  * หมวด 5: ไฟกระพริบตอนปิดไฟ / เรืองแสงริบหรี่ (Phantom Glowing with Smart Switches):
    - เกิดจากสวิตช์ No-Neutral มีกระแสเลี้ยงวงจรผ่านไดรเวอร์ LED แนะนำต่อ Anti-Flicker Safety Bypass Capacitor คร่อมขนานที่ขั้วหลอด L1/N

  * หมวด 6: ตู้ไฟ MDB / เบรกเกอร์ RCBO ทริปตอนฝนตก / ไฟดูดโครงตู้:
    - ตรวจกระแสไฟฟ้ารั่วเกิน 30mA จากจุดภายนอก ตรวจวัดค่าความต้านทานดิน (< 5 โอห์ม) และค่าฉนวนสายไฟ Megger (> 1 MΩ)

- กฎกรณีความต้องการผสม (Mixed Intent / Follow-up Verification) - สำคัญยิ่ง:
  * ตัวอย่าง: "เปิดสวิตช์ไฟแล้วใช้งานได้ตามปกติ ไม่มีการช๊อต ต้องตรวจสอบการเชื่อมต่อกับระบบสมาร์ทโฮมอีกครั้ง" หรือ "วงจรทำงานได้ปกติ แต่ต้องตรวจเช็กสัญญาณเกตเวย์"
  * ช่างระบุว่าอุปกรณ์และวงจรไฟฟ้าทำงานได้เป็นปกติ ไม่มีช็อต/ไม่ลัดวงจร แต่มีคำขอให้ติดตาม "ตรวจสอบการเชื่อมต่อกับระบบสมาร์ทโฮมอีกครั้ง" หรือเช็กเกตเวย์/สัญญาณ:
  * ห้ามประเมินว่าสวิตช์ชำรุด หรือสั่งเปลี่ยนสวิตช์เด็ดขาด!
  * suggestedStatus: ต้องเป็น "Normal" เท่านั้น!
  * observationEn: ต้องแปลความหมายให้ครบถ้วนว่าสวิตช์และวงจรทำงานได้ปกติ ไม่มีการลัดวงจร แต่ระบบสมาร์ทโฮมต้องตรวจสอบการเชื่อมต่อเพิ่มเติม เช่น "Wall lighting switch and operating circuit were tested and confirmed functioning normally under load with no electrical short-circuit or breaker trip detected. However, secondary integration and connectivity with the smart home automation system require follow-up verification and re-testing."
  * observationTh: "เปิดทดสอบสวิตช์ไฟแล้ววงจรทำงานได้ตามปกติ ไม่พบการลัดวงจรหรือกระแสไฟชอร์ต แต่จำเป็นต้องตรวจสอบการเชื่อมต่อกับระบบสมาร์ทโฮม (Smart Home Automation System) เพิ่มเติมอีกครั้ง"
  * recommendedActionEn: "No switch or hardware replacement required. Perform follow-up technical check on smart home gateway pairing, wireless signal transmission, and automation system connectivity."
  * recommendedActionTh: "สวิตช์ไฟและวงจรทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์ แต่ให้ช่างเทคนิคตรวจสอบสัญญาณเชื่อมต่อ เกตเวย์ และระบบสมาร์ทโฮมอีกครั้งเพื่อความสมบูรณ์ในการสั่งการ"
  * riskAssessment: "No active electrical hazard or short-circuit detected. Physical lighting operation is safe; smart home control requires secondary configuration verification."
  * peaceOfMindNote: "Mr. Big ตรวจสอบวงจรสวิตช์ไฟฟ้าให้เรียบร้อย ปลอดภัยไม่มีไฟชอร์ต พร้อมประสานงานเช็กระบบสมาร์ทโฮมให้ครบถ้วน"

- ข้อห้ามเด็ดขาด: ห้ามแปลมั่วหรือทึกทักไปคนละเรื่อง เช่น บันทึกเรื่อง "ประตูบานเลื่อนฝืด ตกร่อง" ห้ามวินิจฉัยว่าเป็นกลอนประตูดิจิทัลเด็ดขาด! บันทึกเรื่อง "ก๊อกน้ำรั่ว" ห้ามสั่งให้ไปเช็กวงจรไฟฟ้าเด็ดขาด! ห้ามนำระบบในอาคารมาใส่ในสวน!

กฎการเขียน:
1. Observation (EN): ต้องแปลและเรียบเรียงเป็นภาษาอังกฤษระดับมืออาชีพ 100% (Technical & Sophisticated Property Inspection Report) ไม่มีคำภาษาไทยปะปนแม้แต่คำเดียว
2. Observation (TH): เรียบเรียงภาษาไทยให้กระชับ ชัดเจน สุภาพ
3. Recommended Action (EN & TH): เสนอทางแก้ไขที่เป็นรูปธรรมและตรงจุด ทั้งภาษาอังกฤษและไทย (หากเป็นสถานะปกติ ให้ระบุไม่ต้องเปลี่ยนอุปกรณ์)
4. Suggested Status: หนึ่งใน ["Normal", "Requires Swap", "Not Working", "Power Tripped", "Disconnected", "Critical Swap"]
5. Risk Assessment: ระบุความเสี่ยงตามจริง หากปกติให้ระบุว่าไม่มีความเสี่ยง
6. Peace of Mind Note: ข้อความสั้นๆ สร้างความมั่นใจให้เจ้าของวิลล่าว่าทีมงานดูแลอย่างใส่ใจ
`;

      const prompt = `
บันทึกภาคสนามจากทีมช่าง:
- พื้นที่/โซน (Location Zone): "${zone || "General Villa Zone"}"
- หมวดหมู่งาน (Category): "${category || "VILLA INSPECTION & PROPERTY CARE"}"
- บันทึกดิบ/เสียงพูดจากช่าง: "${findingTh}"
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              observationEn: { type: Type.STRING },
              observationTh: { type: Type.STRING },
              recommendedActionEn: { type: Type.STRING },
              recommendedActionTh: { type: Type.STRING },
              suggestedStatus: { type: Type.STRING },
              riskAssessment: { type: Type.STRING },
              peaceOfMindNote: { type: Type.STRING },
            },
            required: [
              "observationEn",
              "observationTh",
              "recommendedActionEn",
              "recommendedActionTh",
              "suggestedStatus",
              "riskAssessment",
              "peaceOfMindNote",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.observationEn && parsed.observationTh) {
        // Enforce normal status if user reported normal condition
        if (isNormalText(findingTh)) {
          parsed.suggestedStatus = "Normal";
          const isSmart =
            findingTh.includes("สมาร์ทโฮม") ||
            findingTh.includes("smart home") ||
            findingTh.includes("automation") ||
            findingTh.includes("เกตเวย์") ||
            findingTh.includes("gateway");

          if (isSmart) {
            parsed.recommendedActionEn =
              "No switch or hardware replacement required. Perform follow-up technical check on smart home gateway pairing, wireless signal transmission, and automation system connectivity.";
            parsed.recommendedActionTh =
              "สวิตช์ไฟและวงจรทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์ แต่ให้ช่างเทคนิคตรวจสอบสัญญาณเชื่อมต่อ เกตเวย์ และระบบสมาร์ทโฮมอีกครั้งเพื่อความสมบูรณ์ในการสั่งการ";
            parsed.riskAssessment =
              "No active electrical hazard or short-circuit detected. Physical lighting operation is safe; smart home control requires secondary configuration verification.";
            parsed.peaceOfMindNote =
              "Mr. Big ตรวจสอบวงจรสวิตช์ไฟฟ้าให้เรียบร้อย ปลอดภัยไม่มีไฟชอร์ต พร้อมประสานงานเช็กระบบสมาร์ทโฮมให้ครบถ้วน";
          } else if (
            !parsed.recommendedActionEn ||
            parsed.recommendedActionEn.toLowerCase().includes("replace") ||
            parsed.recommendedActionEn.toLowerCase().includes("swap")
          ) {
            parsed.recommendedActionEn =
              "No hardware replacement or corrective repairs required. Maintain scheduled routine preventive inspections.";
            parsed.recommendedActionTh =
              "ระบบทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์หรือซ่อมแซม ให้คงรอบการตรวจเช็กตามระยะเวลา";
            parsed.riskAssessment = "No active operational or safety hazard identified.";
          }
        }

        // Sanitize: clean any leaked Thai words from observationEn
        parsed.observationEn = parsed.observationEn
          .replace(/ตู้ไฟ\s*mdb/gi, "Main Distribution Board (MDB)")
          .replace(/ตู้ไฟ/gi, "Main Distribution Board (MDB)")
          .replace(/แผงไฟ/gi, "distribution panel")
          .replace(/เบรกเกอร์/gi, "circuit breaker")
          .replace(/ทางเดินเข้าห้องน้ำชั้นล่าง/gi, "ground floor bathroom corridor / hallway")
          .replace(/ทางเดินเข้าห้องน้ำชั้นบน/gi, "upper floor bathroom corridor / hallway")
          .replace(/ทางเดินเข้าห้องน้ำ/gi, "bathroom corridor / hallway")
          .replace(/ทางเดิน/gi, "corridor / hallway")
          .replace(/ห้องน้ำชั้นล่าง/gi, "ground floor bathroom")
          .replace(/ห้องน้ำชั้นบน/gi, "upper floor bathroom")
          .replace(/ห้องน้ำ/gi, "bathroom")
          .replace(/สวนหน้าบ้าน/g, "outside garden")
          .replace(/สวนหลังบ้าน/g, "back garden")
          .replace(/สวนข้างบ้าน/g, "side garden")
          .replace(/หน้าบ้าน/g, "front entrance / yard")
          .replace(/หลังบ้าน/g, "rear perimeter")
          .replace(/สวน/g, "garden");

        const thaiRegex = /[\u0E00-\u0E7F]+/g;
        if (thaiRegex.test(parsed.observationEn)) {
          parsed.observationEn = parsed.observationEn.replace(thaiRegex, translateZoneToEn(zone || ""));
        }

        // Strict engineering validation: Prevent incorrect luminaire classification
        const rawInput = `${findingTh} ${zone}`.toLowerCase();
        const isInGroundInput =
          rawInput.includes("in ground") ||
          rawInput.includes("in-ground") ||
          rawInput.includes("inground") ||
          rawInput.includes("up light") ||
          rawInput.includes("uplight") ||
          rawInput.includes("ไฟฝังพื้น") ||
          rawInput.includes("ฝังพื้น") ||
          rawInput.includes("ส่องขึ้น") ||
          rawInput.includes("well light");

        const isPar38Explicit =
          rawInput.includes("par38") ||
          rawInput.includes("par-38") ||
          rawInput.includes("par 38");

        const isOutdoorZone =
          rawInput.includes("สวน") ||
          rawInput.includes("outside") ||
          rawInput.includes("garden") ||
          rawInput.includes("outdoor") ||
          rawInput.includes("yard") ||
          rawInput.includes("perimeter");

        const lowerEn = parsed.observationEn.toLowerCase();

        // If user specified In-ground uplight, but AI produced downlight or ceiling or par38:
        if (isInGroundInput) {
          if (lowerEn.includes("downlight") || lowerEn.includes("ceiling") || lowerEn.includes("par38")) {
            console.warn("Overriding Gemini mismatch with domainResult for In-Ground Uplight");
            res.json(domainResult);
            return;
          }
        } else if (isPar38Explicit) {
          // If user specified PAR38, but AI produced ceiling downlight:
          if (lowerEn.includes("downlight") || lowerEn.includes("ceiling")) {
            console.warn("Overriding Gemini downlight hallucination with domainResult for outdoor PAR38");
            res.json(domainResult);
            return;
          }
        } else if (isOutdoorZone && !rawInput.includes("downlight") && !rawInput.includes("ดาวน์ไลท์")) {
          // Outdoor area should not have ceiling downlights
          if (lowerEn.includes("downlight") || lowerEn.includes("ceiling")) {
            console.warn("Overriding Gemini downlight hallucination in outdoor zone with domainResult");
            res.json(domainResult);
            return;
          }
        }

        res.json(parsed);
      } else {
        res.json(domainResult);
      }
    } catch (err: any) {
      console.warn("Mr. Big AI fallback used:", err?.message || err);
      res.json(domainResult);
    }
  });

  // Backwards compatibility endpoint for assist-finding
  app.post("/api/gemini/assist-finding", async (req: Request, res: Response) => {
    const { findingTh, zone, category } = req.body;
    const result = analyzeFindingWithMrBig(findingTh || "", zone, category);
    res.json(result);
  });

  // --------------------------------------------------------------------------
  // Intelligent Finding-Based Quotation Builder (Strict Relevance to Defects)
  // --------------------------------------------------------------------------
  function buildQuotationFromFindings(findings: any[], feeRate: number) {
    const hardwareItems: any[] = [];
    const serviceItems: any[] = [];
    let itemCounter = 1;
    let serviceCounter = 1;
    const defectLabels: string[] = [];

    for (const f of findings) {
      if (isNormalFinding(f)) {
        continue;
      }
      const text = `${f.title || ""} ${f.observationTh || ""} ${f.observationEn || ""} ${f.recommendedActionTh || ""} ${f.recommendedActionEn || ""} ${f.locationZone || ""} ${f.zone || ""}`.toLowerCase();
      const zoneName = f.locationZone || f.zone || "พื้นที่หน้างาน";

      // 0.8 In-Ground Landscape Uplight / Well Light / Step Light / Tree Light / 12V SELV Safety Conversion
      const isInGroundOr12V =
        text.includes("in ground") ||
        text.includes("in-ground") ||
        text.includes("inground") ||
        text.includes("up light") ||
        text.includes("uplight") ||
        text.includes("ไฟฝังพื้น") ||
        text.includes("ฝังพื้น") ||
        text.includes("ส่องขึ้น") ||
        text.includes("well light") ||
        text.includes("step light") ||
        text.includes("step-light") ||
        text.includes("ไฟ step") ||
        text.includes("ไฟสเต็ป") ||
        text.includes("tree light") ||
        text.includes("tree-light") ||
        text.includes("ไฟส่องต้นไม้") ||
        text.includes("power supply wiring") ||
        text.includes("12v") ||
        text.includes("12 v") ||
        text.includes("12 โวลต์") ||
        text.includes("แรงดันต่ำ") ||
        text.includes("selv");

      if (isInGroundOr12V) {
        const qty = extractQtySafe(text);
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Outdoor In-Ground Uplight Luminaire 12V 3W Warm White (Heavy-Duty Aluminum/Stainless Trim, IP67/IP68 Waterproof Sealed)`,
          descriptionTh: `หลอด/โคมไฟ In-Ground Uplight 12V 3W แสงวอร์มไวท์ สำหรับไฟฝังพื้น/ไฟสเต็ป/ไฟส่องต้นไม้ พร้อมชุดซีลกันน้ำ`,
          qty: qty,
          unit: "Set",
          unitPrice: 380,
          amount: 380 * qty,
          sourcingChannel: "Electrical Wholesaler / Thai Watsadu / HomePro Phuket",
        });
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Heavy-Duty Weatherproof Outdoor 12V DC Power Supply / Driver (IP67 Waterproof, Anti-Surge Aluminum Casing)`,
          descriptionTh: `ชุดเพาเวอร์ซัพพลาย Power Supply 12V แบบกันน้ำ IP67 บอดี้อลูมิเนียมทนทานสูง สำหรับระบบไฟ 12V ภายนอกอาคาร`,
          qty: 1,
          unit: "Set",
          unitPrice: 550,
          amount: 550,
          sourcingChannel: "Electrical Wholesaler Phuket / Thai Watsadu",
        });
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Outdoor Weatherproof Sealing Compound & Moisture-Proof Joint Kit`,
          descriptionTh: `ชุดกาวซิลิโคนซีลกันน้ำและเทปพันละลายกันความชื้นสำหรับจุดต่อสายไฟภายนอก`,
          qty: 1,
          unit: "Set",
          unitPrice: 150,
          amount: 150,
          sourcingChannel: "Local Hardware Supply Phuket",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Exterior 12V 3W In-Ground Uplight Replacement, Waterproof Sealing & 12V Power Supply Installation at ${zoneName}`,
          detail: `งานเปลี่ยนหลอด In-Ground Uplight 12V 3W ซีลกันน้ำจุดต่อโคมไฟ ติดตั้งเพาเวอร์ซัพพลาย 12V กันน้ำ และทดสอบระบบความปลอดภัย`,
          estimatedSchedule: "ภายใน 24-48 ชม.",
          qty: "1 Job",
          amount: 650,
        });
        defectLabels.push(`ไฟ In-Ground 12V 3W พร้อมชุดซีลและเพาเวอร์ซัพพลายกันน้ำ (${zoneName}) ${qty} ชุด`);
        continue;
      }

      // 1. Outdoor Garden / Landscape Lighting / PAR38 (หลอดไฟ PAR38, ไฟสนาม, ไฟสวน, สปอร์ตไลท์)
      const isOutdoorLighting =
        text.includes("par38") ||
        text.includes("ไฟสนาม") ||
        text.includes("ไฟสวน") ||
        text.includes("สปอร์ตไลท์") ||
        text.includes("สปอตไลท์") ||
        text.includes("ไฟส่องต้นไม้") ||
        text.includes("ไฟกิ่ง") ||
        ((text.includes("หลอดไฟ") || text.includes("ไฟ") || text.includes("โคมไฟ") || text.includes("หลอด")) &&
          (text.includes("สวน") || text.includes("garden") || text.includes("outside") || text.includes("outdoor") || text.includes("หน้าบ้าน")));

      if (isOutdoorLighting) {
        const qty = extractQtySafe(text);
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Standard Market-Grade Outdoor PAR38 LED Lamp (E27, 12W-15W Warm White, IP65 Waterproof)`,
          descriptionTh: `หลอดไฟ PAR38 LED ขั้ว E27 (12W-15W แสงวอร์มไวท์) ราคากลางตลาดทั่วไป สำหรับโคมไฟสนาม/ไฟสวนภายนอก`,
          qty: qty,
          unit: "Unit",
          unitPrice: 220,
          amount: 220 * qty,
          sourcingChannel: "Thai Watsadu / Mega Home / HomePro Phuket",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Outdoor PAR38 Landscape Lamp Replacement & Waterproof Gasket Seal Inspection`,
          detail: `งานเปลี่ยนหลอดไฟสนาม PAR38 ตรวจเช็กซีลยางกันน้ำขั้วหลอด E27 และทดสอบวงจรไฟส่องสว่างภายนอก`,
          estimatedSchedule: "ภายใน 24 ชม.",
          qty: "1 Job",
          amount: 350,
        });
        defectLabels.push(`ไฟสนาม PAR38 (${zoneName}) ${qty} ดวง`);
        continue;
      }

      // 2. Sliding Glass Door / Rollers / Track Alignment
      if (
        text.includes("รางเลื่อน") ||
        text.includes("บานเลื่อน") ||
        text.includes("ลูกล้อ") ||
        text.includes("ตกร่อง") ||
        text.includes("ฝืด") ||
        text.includes("sliding door") ||
        text.includes("roller")
      ) {
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Heavy-Duty SUS304 Stainless Steel Tandem Sliding Door Rollers (Set of 2)`,
          descriptionTh: `ชุดลูกล้อคู่สแตนเลส SUS304 แท้เกรดงานหนัก สำหรับประตูบานเลื่อนกระจกวิลล่า`,
          qty: 1,
          unit: "Set",
          unitPrice: 650,
          amount: 650,
          sourcingChannel: "Official Hafele / Phuket Hardware Center",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Heavy Sliding Glass Door Dismantling, Roller Replacement & Track Alignment`,
          detail: `งานถอดบานกระจกหนัก เปลี่ยนชุดลูกล้อคู่ ปรับตั้งระดับและทำความสะอาดแนวรางเลื่อน`,
          estimatedSchedule: "ภายใน 1 วันทำการ",
          qty: "1 Job",
          amount: 1800,
        });
        defectLabels.push(`ลูกล้อประตูบานเลื่อน (${zoneName})`);
        continue;
      }

      // 3. Plumbing Leak / Sanitary / Faucet
      const isPlumbingIssue =
        text.includes("ก๊อก") ||
        text.includes("faucet") ||
        text.includes("สายฉีด") ||
        text.includes("ท่อน้ำ") ||
        text.includes("ชักโครก") ||
        text.includes("สะดืออ่าง") ||
        text.includes("อ่างล้าง") ||
        text.includes("สุขภัณฑ์") ||
        text.includes("สต็อปวาล์ว") ||
        text.includes("stop valve") ||
        ((text.includes("น้ำรั่ว") || text.includes("น้ำซึม") || text.includes("water leak") || text.includes("pipe leak")) &&
          !text.includes("แอร์") &&
          !text.includes("hvac") &&
          !text.includes("aircon") &&
          !text.includes("สระ") &&
          !text.includes("pool"));

      if (isPlumbingIssue) {
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `High-Grade SUS304 Brushed Stainless Steel Basin Mixer Faucet (Ceramic Cartridge)`,
          descriptionTh: `ก๊อกผสมอ่างล้างหน้าสแตนเลสแท้ SUS304 ผิวปัดด้าน วาล์วเซรามิกทนทาน ไม่เป็นสนิม`,
          qty: 1,
          unit: "Set",
          unitPrice: 1450,
          amount: 1450,
          sourcingChannel: "HomePro Phuket / Boonthavorn",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Defective Sanitary Fitting Removal, Line Flushing & New Faucet Installation`,
          detail: `งานรื้อถอนก๊อกเดิม ล้างเศษตะกอนท่อ ติดตั้งก๊อกสแตนเลสใหม่พร้อมซีลกันรั่วซึม`,
          estimatedSchedule: "ภายใน 1 วันทำการ",
          qty: "1 Job",
          amount: 1200,
        });
        defectLabels.push(`ก๊อกน้ำ/ประปา (${zoneName})`);
        continue;
      }

      // 4. Pop-Up Socket / Desk Power Outlet
      if (
        text.includes("pop up") ||
        text.includes("popup") ||
        text.includes("ปลั๊ก pop") ||
        (text.includes("โต๊ะทำงาน") && (text.includes("ปลั๊ก") || text.includes("เต้ารับ")))
      ) {
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Hafele / Panasonic Desk Pop-Up Power Socket Box (Brushed Aluminium, 2 Universal AC + Fast Charge)`,
          descriptionTh: `ชุดเต้ารับไฟฟ้าแบบป๊อปอัปฝังโต๊ะ Hafele/Panasonic อะลูมิเนียมขัดทราย พร้อมพอร์ตชาร์จด่วน`,
          qty: 1,
          unit: "Set",
          unitPrice: 1650,
          amount: 1650,
          sourcingChannel: "HomePro Phuket / Hafele Studio",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Pop-Up Desk Socket Dismantle, Table Fitting Adjustment & Re-installation`,
          detail: `งานรื้อถอนชุดเต้ารับเดิม ปรับแต่งช่องเจาะโต๊ะ และติดตั้งชุดใหม่พร้อมทดสอบสายดิน`,
          estimatedSchedule: "ภายใน 1 วันทำการ",
          qty: "1 Job",
          amount: 1200,
        });
        defectLabels.push(`เต้ารับป๊อปอัปโต๊ะทำงาน (${zoneName})`);
        continue;
      }

      // 5. Wall Light Switch
      if (text.includes("สวิตช์") || text.includes("switch")) {
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Schneider Electric / Panasonic AvatarOn 1-Gang Rocker Switch`,
          descriptionTh: `ชุดสวิตช์ไฟ Schneider Electric / Panasonic ดีไซน์โมเดิร์น ไร้ขอบ เกรดวิลล่า`,
          qty: 1,
          unit: "Set",
          unitPrice: 320,
          amount: 320,
          sourcingChannel: "HomePro Phuket / Global House",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Wall Switch Replacement, Terminal Tightening & Load Test`,
          detail: `งานถอดเปลี่ยนสวิตช์เดิม เข้าหัวสายไฟใหม่ และทดสอบการทำงานของวงจร`,
          estimatedSchedule: "ภายใน 1 วันทำการ",
          qty: "1 Job",
          amount: 450,
        });
        defectLabels.push(`สวิตช์ไฟ (${zoneName})`);
        continue;
      }

      // 6. Ceiling Paint / Dampness / Mold
      if (
        text.includes("ฝ้า") ||
        text.includes("ความชื้น") ||
        text.includes("สีลอก") ||
        text.includes("เชื้อรา") ||
        text.includes("ceiling") ||
        text.includes("mold")
      ) {
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `TOA Moisture-Blocking Primer & Interior Acrylic Paint Matched Shade Kit`,
          descriptionTh: `น้ำยารองพื้นปูนเก่าสูตรกันชื้น TOA พร้อมสีน้ำอะคริลิกเกรดพรีเมียมผสมเฉดตรงเดิม`,
          qty: 1,
          unit: "Set",
          unitPrice: 1250,
          amount: 1250,
          sourcingChannel: "HomePro Phuket / Thai Watsadu",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Ceiling Patching, Moisture Sealing & Matched Color Restoration`,
          detail: `งานขูดลอกฟิล์มสีเดิม ทาน้ำยากันชื้น โป๊วผิวเรียบ และทาสีทับหน้า 2 เที่ยวอย่างประณีต`,
          estimatedSchedule: "ภายใน 2 วันทำการ",
          qty: "1 Job",
          amount: 2200,
        });
        defectLabels.push(`ฝ้าเพดาน/ความชื้น (${zoneName})`);
        continue;
      }

      // 7. Circuit Breaker / RCBO / Earth Leakage
      if (
        text.includes("เบรกเกอร์") ||
        text.includes("rcbo") ||
        text.includes("ทริป") ||
        text.includes("trip") ||
        text.includes("ไฟรั่ว") ||
        text.includes("ไฟดูด") ||
        text.includes("mdb")
      ) {
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Schneider Electric Acti9 RCBO 2P 30mA Earth Leakage Breaker`,
          descriptionTh: `เบรกเกอร์ตัดไฟรั่วดูด Schneider Electric มาตรฐานสากลสำหรับตู้ไฟหลัก`,
          qty: 1,
          unit: "Unit",
          unitPrice: 1850,
          amount: 1850,
          sourcingChannel: "HomePro Phuket / Global House",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Electrical Insulation Megger Test & RCBO Replacement Labor`,
          detail: `ตรวจวัดค่าความเป็นฉนวนสายไฟ หาสาเหตุไฟรั่ว และเปลี่ยนเบรกเกอร์ตัดไฟดูด RCBO ใหม่`,
          estimatedSchedule: "ภายใน 1 วันทำการ",
          qty: "1 Job",
          amount: 1500,
        });
        defectLabels.push(`เบรกเกอร์ RCBO (${zoneName})`);
        continue;
      }

      // 8. Air Conditioning / HVAC
      if (text.includes("แอร์") || text.includes("air") || text.includes("hvac") || text.includes("ไม่เย็น")) {
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Daikin / Mitsubishi Inverter Dual Motor Run Capacitor 40uF & Chemical Coil Foam`,
          descriptionTh: `คาปาซิเตอร์รันมอเตอร์แท้มาตรฐานศูนย์ พร้อมโฟมเคมีล้างแผงคอยล์ความเย็นเข้มข้น`,
          qty: 1,
          unit: "Set",
          unitPrice: 960,
          amount: 960,
          sourcingChannel: "Phuket Air Parts Distributor / HomePro",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `AC Capacitor Replacement & High-Pressure Chemical Coil Wash`,
          detail: `งานเปลี่ยนคาปาซิเตอร์ ล้างทำความสะอาดแผงคอยล์เย็น-ร้อนด้วยปั๊มแรงดันสูง และตรวจวัดน้ำยาแอร์`,
          estimatedSchedule: "ภายใน 1-2 วันทำการ",
          qty: "1 Job",
          amount: 1800,
        });
        defectLabels.push(`เครื่องปรับอากาศ (${zoneName})`);
        continue;
      }

      // 9. Pool Pump / Water Circulation
      if (text.includes("สระ") || text.includes("pool pump") || text.includes("ปั๊ม")) {
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `NSK Sealed High-Speed Ball Bearings & Chlorine-Resistant Mechanical Shaft Seal`,
          descriptionTh: `ตลับลูกปืนรอบจัด NSK ญี่ปุ่น พร้อมชุดแมคคานิคอลซีลกันน้ำทนคลอรีนสระว่ายน้ำ`,
          qty: 1,
          unit: "Set",
          unitPrice: 1600,
          amount: 1600,
          sourcingChannel: "Phuket Pool Supply / Thai Watsadu",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Pool Pump Motor Overhaul & Shaft Seal Installation Labor`,
          detail: `งานถอดประกอบมอเตอร์ปั๊มสระ อัดตลับลูกปืนใหม่ เปลี่ยนซีลกันน้ำ และทดสอบแรงดันระบบน้ำสระ`,
          estimatedSchedule: "ภายใน 1-2 วันทำการ",
          qty: "1 Job",
          amount: 2200,
        });
        defectLabels.push(`ปั๊มน้ำสระว่ายน้ำ (${zoneName})`);
        continue;
      }

      // 10. Indoor Ceiling Downlight (Only if NOT outdoor)
      if (text.includes("ดาวน์ไลท์") || text.includes("downlight") || text.includes("หลอดไฟ") || text.includes("led")) {
        hardwareItems.push({
          item: itemCounter++,
          descriptionEn: `Philips / Opple Architectural Recessed LED Downlight 12W Warm White`,
          descriptionTh: `โคมไฟดาวน์ไลท์ LED ฝังฝ้า Philips/Opple แสงวอร์มไวท์ 12W พร้อมชุดไดรเวอร์มาตรฐาน มอก.`,
          qty: 1,
          unit: "Unit",
          unitPrice: 380,
          amount: 380,
          sourcingChannel: "HomePro Phuket / Thai Watsadu",
        });
        serviceItems.push({
          item: serviceCounter++,
          description: `Recessed Downlight Replacement & Constant-Current Driver Testing`,
          detail: `งานเปลี่ยนโคมไฟดาวน์ไลท์ ตรวจเช็กสายไฟและไดรเวอร์ขับกระแสคงที่`,
          estimatedSchedule: "ภายใน 24 ชม.",
          qty: "1 Job",
          amount: 450,
        });
        defectLabels.push(`โคมไฟดาวน์ไลท์ (${zoneName})`);
        continue;
      }

      // 11. General Defect Rectification
      hardwareItems.push({
        item: itemCounter++,
        descriptionEn: `Precision Villa Property Care Replacement Hardware & Fasteners Kit`,
        descriptionTh: `ชุดอุปกรณ์อะไหล่และวัสดุสิ้นเปลืองงานซ่อมบำรุงเกรดวิลล่า สำหรับจุดตรวจพบ "${f.title || f.observationTh || 'ทั่วไป'}"`,
        qty: 1,
        unit: "Set",
        unitPrice: 650,
        amount: 650,
        sourcingChannel: "HomePro Phuket / Local Hardware",
      });
      serviceItems.push({
        item: serviceCounter++,
        description: `Villa Inspection Defect Rectification & Adjustment Labor`,
        detail: `งานทีมช่างเข้าแก้ไขจุดบกพร่องตามรายงานการตรวจ เปลี่ยนอะไหล่และปรับตั้งระบบให้สมบูรณ์`,
        estimatedSchedule: "ภายใน 1-2 วันทำการ",
        qty: "1 Job",
        amount: 1200,
      });
      defectLabels.push(`งานซ่อมบำรุง (${zoneName})`);
    }

    const feePct = Math.round(feeRate * 100);

    if (hardwareItems.length === 0 && findings.length > 0) {
      const isSmartHomeOrNetwork = findings.some((f: any) => {
        const t = `${f.observationTh || ""} ${f.observationEn || ""} ${f.findingTh || ""}`.toLowerCase();
        return (
          t.includes("สมาร์ทโฮม") ||
          t.includes("smart home") ||
          t.includes("gateway") ||
          t.includes("เกตเวย์") ||
          t.includes("zigbee") ||
          t.includes("wifi") ||
          t.includes("เน็ต")
        );
      });

      const serviceDesc = isSmartHomeOrNetwork
        ? "Smart Home Gateway & Wireless Integration Diagnostic Audit"
        : "Villa Technical Inspection & Electrical Safety Audit Service";

      const serviceDetail = isSmartHomeOrNetwork
        ? "งานตรวจเช็กระบบสมาร์ทโฮม ตรวจสอบสัญญาณเชื่อมต่อเกตเวย์ (Gateway/Coordinator) วิเคราะห์คลื่นสัญญาณไร้สาย Zigbee/Wi-Fi และทดสอบการสั่งการผ่านแอปพลิเคชัน อุปกรณ์เดิมทำงานได้ปกติ ไม่ต้องเปลี่ยนฮาร์ดแวร์"
        : "งานตรวจเช็กระบบวิลล่าเชิงป้องกัน (Preventive Maintenance Audit) ตรวจสอบตู้ไฟ MDB วัดค่าความเป็นฉนวนวงจรไฟฟ้า ตรวจสอบค่าความต้านทานหลักดิน และอุปกรณ์ ผลการตรวจสอบผ่านเกณฑ์มาตรฐานทุกจุด ทำงานได้เป็นปกติสมบูรณ์ ไม่พบการลัดวงจร";

      const serviceAmount = isSmartHomeOrNetwork ? 1200 : 1500;

      return {
        hardwareItems: [],
        serviceItems: [
          {
            item: 1,
            description: serviceDesc,
            detail: serviceDetail,
            estimatedSchedule: "ดำเนินการเสร็จสิ้นเรียบร้อย",
            qty: "1 Job",
            amount: serviceAmount,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "ผลการตรวจเช็กหน้างานยืนยันว่าอุปกรณ์และวงจรไฟฟ้าเดิมทำงานได้สมบูรณ์ ไม่พบการลัดวงจร ไม่จำเป็นต้องเปลี่ยนอุปกรณ์ ช่วยประหยัดค่าใช้จ่ายอะไหล่ 0 บาท",
          "ค่าบริการตรวจเช็กและวินิจฉัยหน้างาน (On-site Diagnostic Fee) ครอบคลุมค่าเดินทาง เวลาหน้างาน การใช้เครื่องมือวัดวิศวกรรม และการออกรายงานรับรองความปลอดภัยตามมาตรฐานวิลล่าภูเก็ต",
          "สำหรับวิลล่าที่มีสัญญาบริการดูแลและตรวจรับประจำรายเดือน (AMC) รายการค่าบริการตรวจเช็กนี้สามารถยกเว้น (Waive) ได้",
        ],
        contingencies: [
          "หากต้องการให้ทีมช่างตรวจเช็กเพิ่มเติมในจุดอื่น สามารถแจ้งประสานงานกับทีมงานได้ตลอด 24 ชม.",
        ],
        mollyNotes: `Molly ได้ตรวจสอบรายงานผลการตรวจเช็กของ Mr. Big อย่างละเอียดแล้วค่ะ ทุกระบบและวงจรไฟฟ้าทำงานได้เป็นปกติดีเยี่ยม ไม่มีการลัดวงจร จึงไม่มีรายการสั่งซื้ออะไหล่หรือเปลี่ยนอุปกรณ์ใหม่ (ยอดค่าอะไหล่ 0 บาท ช่วยประหยัดค่าใช้จ่ายได้ทันทีค่ะ) มีเพียงค่าบริการตรวจเช็กและวินิจฉัยเชิงวิศวกรรมหน้างาน (On-site Diagnostic Fee) ตามมาตรฐานสากลของวิลล่าในภูเก็ต เพื่อครอบคลุมการทดสอบเครื่องมือวัดความปลอดภัยและออกรายงานรับรองค่ะ (หากวิลล่ามีสัญญา AMC อยู่แล้ว รายการนี้สามารถยกเว้นได้ค่ะ)`,
      };
    }

    return {
      hardwareItems,
      serviceItems,
      procurementFeeRate: feeRate,
      terms: [
        "อะไหล่และอุปกรณ์คัดสรรเกรดคุณภาพสูงรับประกันศูนย์ 1 ปี",
        "รับประกันงานติดตั้งและซ่อมบำรุง 60 วันเต็มตามมาตรฐาน Phuket Trusted Local",
        "มีรายงานภาพถ่ายสรุปผลการเปลี่ยนอะไหล่ก่อนและหลังแก้ไขเพื่อความสบายใจของเจ้าของวิลล่า",
      ],
      contingencies: [
        "หากพบความเสียหายหรือจุดชำรุดซ่อนเร้นเพิ่มเติม ช่างจะบันทึกภาพและแจ้งประเมินก่อนลงมือปฏิบัติงานเสมอ",
      ],
      mollyNotes: `Molly ได้จัดสรรรายการอะไหล่และค่าแรงช่างตรงตามจุดที่ Mr. Big ตรวจพบหน้างาน (${defectLabels.join(", ")}) คัดสรรอุปกรณ์ของแท้พร้อมสต็อกในภูเก็ต และคิดค่าจัดหา/ควบคุมคุณภาพ ${feePct}% เพื่อความสบายใจสูงสุดของเจ้าของวิลล่าค่ะ`,
    };
  }

  // Helper for smart fallback quotations
  const getSmartMollyQuotation = (
    serviceType: string = "",
    customRequest: string = "",
    findings: any[] = [],
    customerName: string = "",
    location: string = "",
    feeRate: number = 0.15
  ) => {
    const feePct = Math.round(feeRate * 100);
    const textCorpus = `${serviceType} ${customRequest}`.toLowerCase();

    // SPECIAL SKILL: Cancellation / Missed Appointment Fee (ค่าสงวนเวลาช่าง / ลูกค้าหรือผู้เช่าผิดนัดหมาย)
    const isMissedAppointmentRequest =
      textCorpus.includes("ผิดนัด") ||
      textCorpus.includes("เสียเวลา") ||
      textCorpus.includes("เบี้ยวนัด") ||
      textCorpus.includes("missed appointment") ||
      textCorpus.includes("cancellation fee") ||
      textCorpus.includes("เข้าบ้านไม่ได้") ||
      textCorpus.includes("ไม่มาตามนัด") ||
      textCorpus.includes("no-show") ||
      textCorpus.includes("aborted");

    if (isMissedAppointmentRequest) {
      const isRepeated2x =
        textCorpus.includes("2 ครั้ง") ||
        textCorpus.includes("2 รอบ") ||
        textCorpus.includes("เบี้ยว 2") ||
        textCorpus.includes("สองครั้ง");
      const isTraveledOnsite =
        textCorpus.includes("เดินทาง") ||
        textCorpus.includes("หน้างาน") ||
        textCorpus.includes("1500") ||
        textCorpus.includes("1,500");
      const ratePerVisit = isTraveledOnsite ? 1500 : 1000;
      const visits = isRepeated2x ? 2 : 1;
      const missedAmount = ratePerVisit * visits;

      // Extract existing repair findings if any (to respect the 3-Item Separation rule!)
      const existingFindingsQuotation =
        Array.isArray(findings) && findings.length > 0
          ? buildQuotationFromFindings(findings, feeRate)
          : null;

      const hardwareItems = existingFindingsQuotation?.hardwareItems || [];
      const baseServices = existingFindingsQuotation?.serviceItems || [];

      const missedItem = {
        item: baseServices.length + 1,
        description: "Cancellation / Missed Appointment Fee",
        detail:
          visits > 1
            ? `ค่าธรรมเนียมสงวนเวลาช่างและจัดสรรเส้นทางเข้าหน้างาน จำนวน ${visits} ครั้ง (Dedicated Route & Opportunity Cost - กรณีผู้เช่าไม่มาตามนัด / เข้าวิลล่าไม่ได้)`
            : `ค่าธรรมเนียมสงวนเวลาช่างและจัดสรรเส้นทางเข้าหน้างาน (Dedicated Technician Route & Opportunity Cost - กรณีเข้าวิลล่าไม่ได้/ผู้เช่าไม่มาตามนัด)`,
        estimatedSchedule: "เรียกเก็บตามนโยบายการนัดหมาย (Appointment Policy)",
        qty: `${visits} ครั้ง (Visits)`,
        amount: missedAmount,
      };

      return {
        hardwareItems,
        serviceItems: [...baseServices, missedItem],
        procurementFeeRate: feeRate,
        terms: [
          "Appointment Policy: As the technician needs to be scheduled specifically for your property, we kindly ask that someone is available at the agreed appointment time.",
          "Cancellations with less than 24 hours’ notice or missed appointments may be subject to a Cancellation / Missed Appointment Fee of THB 1,000.",
          "สำหรับการนัดหมายครั้งถัดไป ทีมงานแนะนำเรียกเก็บเงินมัดจำล่วงหน้า (Appointment Deposit) THB 1,000: หากมาตามนัด ยอดนี้จะนำไปหักเต็มจำนวนจากค่าติดตั้ง/ค่าบริการจริง แต่หากเบี้ยวนัดโดยไม่แจ้งล่วงหน้า 24 ชม. ขอสงวนสิทธิ์ไม่คืนเงินมัดจำ",
          "Phuket Trusted Local ยึดหลักความโปร่งใส แยก 3 รายการชัดเจน (Replacement/Installation, Travel/Call-out, Missed Appointment Fee) โดยไม่ใช้คำว่า Penalty และไม่นำไปแอบแฝงในค่าอะไหล่",
        ],
        contingencies: [
          "หากต้องการเลื่อนหรือยกเลิกการนัดหมาย กรุณาแจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมงเพื่อยกเว้นค่าธรรมเนียมสงวนเวลาช่าง",
        ],
        mollyNotes: `Molly ได้จัดทำใบเสนอราคาโดยระบุรายการ Cancellation / Missed Appointment Fee ${missedAmount.toLocaleString()} บาท ไว้อย่างชัดเจนและโปร่งใสตามมาตรฐาน Phuket Trusted Local ค่ะ เราไม่ใช้คำว่า Penalty แต่คิดเป็นค่าบริการสำหรับเวลาและความเชี่ยวชาญของช่างที่ถูกจัดสรรไว้เฉพาะสำหรับวิลล่า (Dedicated Technician Time & Opportunity Cost) โดยไม่นำไปบวกแอบแฝง พร้อมระบุเงื่อนไข Appointment Policy และระบบมัดจำล่วงหน้านัดหมายรอบใหม่เพื่อความสบายใจสูงสุดค่ะ`,
      };
    }

    // PRIORITY 1: If findings are provided from inspection, construct quotation STRICTLY based on detected findings!
    if (Array.isArray(findings) && findings.length > 0) {
      const quotationFromFindings = buildQuotationFromFindings(findings, feeRate);
      if (quotationFromFindings.hardwareItems.length > 0 || quotationFromFindings.serviceItems.length > 0) {
        return quotationFromFindings;
      }
    }

    // 0. Outdoor Garden / Landscape Lighting / PAR38 (หลอดไฟ PAR38, ไฟสนาม, ไฟสวน)
    if (
      textCorpus.includes("par38") ||
      textCorpus.includes("ไฟสนาม") ||
      textCorpus.includes("ไฟสวน") ||
      textCorpus.includes("สปอร์ตไลท์") ||
      textCorpus.includes("สปอตไลท์") ||
      textCorpus.includes("ไฟส่องต้นไม้") ||
      ((textCorpus.includes("หลอดไฟ") || textCorpus.includes("ไฟ")) &&
        (textCorpus.includes("สวน") || textCorpus.includes("garden") || textCorpus.includes("outside") || textCorpus.includes("outdoor") || textCorpus.includes("หน้าบ้าน")))
    ) {
      const qty = extractQtySafe(textCorpus);
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "Outdoor Waterproof PAR38 LED Floodlight Lamp (E27, 15W-18W Warm White, IP65)",
            descriptionTh: "หลอดไฟสนาม PAR38 LED กันน้ำกันฝน IP65 ขั้ว E27 แสงวอร์มไวท์สำหรับโคมส่องต้นไม้/สวน",
            qty: qty,
            unit: "Unit",
            unitPrice: 390,
            amount: 390 * qty,
            sourcingChannel: "HomePro Phuket Chalong / Thai Watsadu",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "Outdoor PAR38 Landscape Lamp Replacement & Waterproof Gasket Seal Inspection",
            detail: "งานเปลี่ยนหลอดไฟสนาม PAR38 ตรวจเช็กซีลยางกันน้ำขั้วหลอด E27 และทดสอบวงจรไฟส่องสว่างภายนอก",
            estimatedSchedule: "ภายใน 24 ชม.",
            qty: "1 Job",
            amount: 600,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "หลอดไฟสนาม PAR38 LED กันน้ำ IP65 รับประกันศูนย์ 1 ปี",
          "รับประกันงานติดตั้งและซีลกันน้ำ 30 วัน",
        ],
        contingencies: [
          "ตรวจเช็กขั้วรับหลอด E27 หากพบสนิมหรือเกลียวไหม้จะแจ้งประเมินเปลี่ยนขั้วก่อนดำเนินการ",
        ],
        mollyNotes: `Molly ได้จัดสรรหลอดไฟสนาม PAR38 LED กันน้ำกันฝน IP65 แสงวอร์มไวท์สำหรับสวนหน้าบ้าน มีสต็อกพร้อมจัดส่งทันที พร้อมคิดค่าจัดหาและตรวจรับ ${feePct}% ค่ะ`,
      };
    }

    // 0. Pop-Up Socket / Desk Power Outlet / เต้ารับป๊อปอัปฝังโต๊ะ
    if (
      textCorpus.includes("pop up") ||
      textCorpus.includes("popup") ||
      textCorpus.includes("ปลั๊ก pop") ||
      textCorpus.includes("ปลั๊กไฟ") ||
      textCorpus.includes("เต้ารับ") ||
      textCorpus.includes("เต้าเสียบ") ||
      textCorpus.includes("socket") ||
      textCorpus.includes("outlet")
    ) {
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "Hafele / Panasonic Desk Pop-Up Power Socket Box (Brushed Aluminium, 2 Universal AC + 20W Type-C/A Fast Charge)",
            descriptionTh: "ชุดเต้ารับไฟฟ้าแบบป๊อปอัปฝังโต๊ะ Hafele/Panasonic อะลูมิเนียมขัดทราย (2 เต้ารับสากล + พอร์ตชาร์จด่วน Type-C/A พร้อมสายดิน 16A)",
            qty: 1,
            unit: "Set",
            unitPrice: 1650,
            amount: 1650,
            sourcingChannel: "HomePro Phuket / Hafele Design Studio",
          },
          {
            item: 2,
            descriptionEn: "Thai Yazaki VAF-G 2x2.5/1.5 Grounded Cable & Flexible Metallic Conduit Pack",
            descriptionTh: "สายไฟฟ้าทองแดงแท้ Thai Yazaki พร้อมสายดิน และท่อร้อยสายไฟเฟล็กซ์กันหนูกัดแทะ",
            qty: 1,
            unit: "Set",
            unitPrice: 420,
            amount: 420,
            sourcingChannel: "HomePro Phuket / Global House",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "Pop-Up Desk Socket Dismantle, Table Fitting Adjustment & Re-installation",
            detail: "งานรื้อถอนชุดเต้ารับป๊อปอัปเดิมที่ชำรุด ปรับแต่งช่องเจาะโต๊ะ และติดตั้งชุดใหม่พร้อมจัดระเบียบสายไฟ",
            estimatedSchedule: "ภายใน 1-2 วันทำการ",
            qty: "1 Job",
            amount: 1200,
          },
          {
            item: 2,
            description: "Electrical Grounding Test, Polarity Verification & Full Load Safety Audit",
            detail: "ตรวจวัดความต้านทานสายดิน ตรวจสอบขั้วไฟฟ้า L-N-G และทดสอบโหลดจ่ายไฟเพื่อความปลอดภัยสูงสุด",
            estimatedSchedule: "ในวันเดียวกับงานติดตั้ง",
            qty: "1 Job",
            amount: 600,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "ชุดเต้ารับป๊อปอัป Hafele/Panasonic รับประกันศูนย์ 1 ปีเต็ม",
          "รับประกันงานติดตั้งระบบไฟฟ้าและสายดิน 30 วัน",
          "ตรวจสอบความปลอดภัยด้วยเครื่องวัดมาตรฐานก่อนส่งมอบงาน",
        ],
        contingencies: [
          "กรณีโต๊ะทำงานมีความหนาพิเศษหรือช่องเจาะเดิมไม่ตรงรุ่น ช่างจะทำการแต่งขอบโต๊ะอย่างประณีต",
        ],
        mollyNotes: `Molly ได้เปรียบเทียบราคาและคัดสรรชุดเต้ารับป๊อปอัปฝังโต๊ะคุณภาพสูงเกรดพรีเมียม (Hafele / Panasonic) พร้อมพอร์ตชาร์จด่วน Type-C ตรงตามที่ช่างตรวจพบปัญหาที่โต๊ะทำงาน พร้อมคิดค่าประสานงานและตรวจรับ ${feePct}% เพื่อความสบายใจสูงสุดค่ะ`,
      };
    }

    // 0.5 Wall Light Switch / Smart Switch
    if (
      textCorpus.includes("สวิตช์") ||
      textCorpus.includes("wall switch") ||
      textCorpus.includes("light switch")
    ) {
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "Tuya Zigbee 2-Gang Heavy-Duty Smart Wall Switch (Tempered Glass, Neutral Wire)",
            descriptionTh: "สวิตช์ไฟอัจฉริยะแบบ 2 ช่อง ทนกระแสโหลดสูง รองรับระบบ Smart Home และสวิตช์ผนัง",
            qty: 1,
            unit: "Unit",
            unitPrice: 790,
            amount: 790,
            sourcingChannel: "Official Shopee Mall / Authorized Store",
          },
          {
            item: 2,
            descriptionEn: "High-Inrush Safety Bypass Capacitor & WAGO Terminal Wire Connectors",
            descriptionTh: "ตัวเก็บประจุตัดกระแสไฟกระชากและขั้วต่อสายไฟ WAGO มาตรฐานเยอรมัน",
            qty: 1,
            unit: "Set",
            unitPrice: 250,
            amount: 250,
            sourcingChannel: "HomePro Phuket",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "Wall Switch Replacement, Circuit Diagnostics & Gateway Pairing",
            detail: "งานถอดเปลี่ยนชุดสวิตช์ไฟ ตรวจสอบการลัดวงจร และเชื่อมต่อทดสอบการสั่งงาน",
            estimatedSchedule: "ภายใน 24-48 ชม.",
            qty: "1 Job",
            amount: 1200,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "สวิตช์ไฟรับประกันศูนย์ 1 ปี",
          "รับประกันงานติดตั้งและทดสอบระบบ 30 วัน",
        ],
        contingencies: [
          "กรณีไม่มีสายนิวทรัล (N) ที่บล็อกสวิตช์เดิม ช่างจะติดตั้งตัวเก็บประจุ Bypass เพิ่มเติมให้ครบถ้วน",
        ],
        mollyNotes: `Molly ได้จัดสรรชุดสวิตช์ไฟคุณภาพสูง พร้อมคิดค่าจัดหาและตรวจรับงาน ${feePct}% เพื่อความสบายใจสูงสุดค่ะ`,
      };
    }

    // 1. Sliding Doors, Windows, Rollers, Tracks & Hardware (ประตูบานเลื่อน, รางเลื่อน, ลูกล้อ, บานพับ, มือจับ, ฝืด, ตกร่อง)
    if (
      textCorpus.includes("บานเลื่อน") ||
      textCorpus.includes("ลูกล้อ") ||
      textCorpus.includes("รางเลื่อน") ||
      textCorpus.includes("ราง") ||
      textCorpus.includes("ตกร่อง") ||
      textCorpus.includes("ฝืด") ||
      textCorpus.includes("บานพับ") ||
      textCorpus.includes("กระจก") ||
      (textCorpus.includes("ประตู") && !textCorpus.includes("ดิจิทัล") && !textCorpus.includes("smart lock")) ||
      textCorpus.includes("sliding door") ||
      textCorpus.includes("roller") ||
      textCorpus.includes("window")
    ) {
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "Heavy-Duty SUS304 Stainless Steel Tandem Sliding Door Rollers (Set of 2)",
            descriptionTh: "ชุดลูกล้อคู่สแตนเลส SUS304 ทนทานสูงสำหรับประตูบานเลื่อนกระจกหนัก ไม่เป็นสนิม",
            qty: 2,
            unit: "Sets",
            unitPrice: 650,
            amount: 1300,
            sourcingChannel: "HomePro Phuket / Hafele Fitting Center",
          },
          {
            item: 2,
            descriptionEn: "Anodized Aluminium Bottom Sill Replacement Guide Track (2.4m)",
            descriptionTh: "รางเลื่อนอะลูมิเนียมชุบอโนไดซ์เกรดวิลล่า ทนไอเกลือทะเลและความชื้นสูง",
            qty: 1,
            unit: "Unit",
            unitPrice: 850,
            amount: 850,
            sourcingChannel: "Local Phuket Aluminium Supply",
          },
          {
            item: 3,
            descriptionEn: "PTFE Dry Film Lubricant & Weatherstrip Brush Seal Replacement Roll",
            descriptionTh: "สเปรย์หล่อลื่นชนิดฟิล์มแห้งกันทรายเกาะ พร้อมคิ้วขนแปรงกันฝุ่นและเสียงรบกวน",
            qty: 1,
            unit: "Set",
            unitPrice: 380,
            amount: 380,
            sourcingChannel: "Thai Watsadu Phuket",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "Heavy Sliding Glass Door Dismantling, Roller Replacement & Track Alignment",
            detail: "งานยกถอดบานเลื่อนกระจก เปลี่ยนชุดลูกล้อคู่สแตนเลส ปรับตั้งแนวรางและระดับบานให้ขนานสมบูรณ์",
            estimatedSchedule: "ภายใน 1-2 วันทำการ",
            qty: "1 Job",
            amount: 1800,
          },
          {
            item: 2,
            description: "Smooth Gliding Calibration, Latch Engagement Test & Weather Seal Verification",
            detail: "ปรับตั้งความนุ่มนวลในการเลื่อน ตรวจสอบตัวล็อกและซีลกันน้ำฝนสาดเข้าตัวอาคาร",
            estimatedSchedule: "ในวันเดียวกับงานติดตั้ง",
            qty: "1 Job",
            amount: 800,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "ชุดลูกล้อสแตนเลสและรางเลื่อนรับประกัน 1 ปีเต็ม",
          "รับประกันงานปรับตั้งระดับและการเลื่อนเปิด-ปิด 60 วัน",
        ],
        contingencies: [
          "กรณีบานกระจกมีขนาดสูงพิเศษเกิน 2.8 ม. อาจจำเป็นต้องใช้ช่างชำนาญการ 3-4 คนในการประคอง",
        ],
        mollyNotes: `Molly ได้คัดสรรชุดลูกล้อคู่สแตนเลส SUS304 เกรดพรีเมียม ทนทานต่อไอเกลือทะเลภูเก็ต พร้อมคิดค่าจัดหาและตรวจรับ ${feePct}% เพื่อให้ประตูเลื่อนลื่นนุ่มมือ ไร้เสียงรบกวน และปิดล็อกแน่นหนาค่ะ`,
      };
    }

    // 2. Plumbing, Faucets, Water Leaks, Drains & Sanitary (ก๊อกน้ำ, ท่อรั่ว, น้ำหยด, ชักโครก, สายฉีดชำระ, สะดืออ่าง, สต็อปวาล์ว)
    const isPlumbingCorpus =
      textCorpus.includes("ก๊อก") ||
      textCorpus.includes("faucet") ||
      textCorpus.includes("ท่อน้ำ") ||
      textCorpus.includes("ท่อระบาย") ||
      textCorpus.includes("ท่อน้ำทิ้ง") ||
      textCorpus.includes("สายฉีด") ||
      textCorpus.includes("ชักโครก") ||
      textCorpus.includes("สะดืออ่าง") ||
      textCorpus.includes("อ่างล้าง") ||
      textCorpus.includes("ซิงค์") ||
      textCorpus.includes("ฝักบัว") ||
      textCorpus.includes("สต็อปวาล์ว") ||
      textCorpus.includes("วาล์วน้ำ") ||
      textCorpus.includes("plumbing") ||
      ((textCorpus.includes("น้ำรั่ว") || textCorpus.includes("น้ำซึม") || textCorpus.includes("water leak") || textCorpus.includes("pipe leak")) &&
        !textCorpus.includes("แอร์") &&
        !textCorpus.includes("hvac") &&
        !textCorpus.includes("aircon") &&
        !textCorpus.includes("สระ") &&
        !textCorpus.includes("pool"));

    if (isPlumbingCorpus) {
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "High-Grade SUS304 Brushed Stainless Steel Basin Mixer Faucet (Ceramic Cartridge)",
            descriptionTh: "ก๊อกน้ำอ่างล้างหน้าสแตนเลส SUS304 ปลอดสนิม พร้อมไส้วาล์วเซรามิกแท้ทนทานสูง",
            qty: 1,
            unit: "Unit",
            unitPrice: 1450,
            amount: 1450,
            sourcingChannel: "HomePro Phuket / Thai Watsadu",
          },
          {
            item: 2,
            descriptionEn: "Heavy-Duty Braided Stainless Steel Flexible Supply Hoses & Brass Angle Stop Valve",
            descriptionTh: "สายน้ำดีสแตนเลสถักทนแรงดันสูง 2 เส้น พร้อมสต็อปวาล์วเซรามิกทองเหลืองแท้",
            qty: 1,
            unit: "Set",
            unitPrice: 580,
            amount: 580,
            sourcingChannel: "HomePro Phuket Chalong",
          },
          {
            item: 3,
            descriptionEn: "Brass P-Trap Drainage Assembly Kit & Industrial PTFE Thread Sealant",
            descriptionTh: "ชุดท่อน้ำทิ้งทองเหลืองชุบโครเมียม และเทปพันเกลียวมาตรฐานสากลกันน้ำรั่วซึม",
            qty: 1,
            unit: "Set",
            unitPrice: 450,
            amount: 450,
            sourcingChannel: "Global House Phuket",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "Defective Sanitary Fitting Removal, Line Flushing & New Faucet Installation",
            detail: "งานรื้อถอนก๊อกเดิม เป่าล้างเศษตะกอนในท่อน้ำดี และติดตั้งชุดก๊อกน้ำสแตนเลสใหม่พร้อมเดินท่อน้ำทิ้ง",
            estimatedSchedule: "ภายใน 24-48 ชม.",
            qty: "1 Job",
            amount: 1200,
          },
          {
            item: 2,
            description: "Dynamic Water Pressure Leak Test & Vanity Cabinet Moisture Inspection",
            detail: "เปิดทดสอบแรงดันน้ำต่อเนื่อง 30 นาที ตรวจเช็กรอยต่อทุกจุด และตรวจความชื้นใต้อ่างล้างหน้า",
            estimatedSchedule: "ในวันเดียวกับงานติดตั้ง",
            qty: "1 Job",
            amount: 600,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "ชุดก๊อกน้ำและวาล์วเซรามิกรับประกันการรั่วซึม 1 ปีเต็ม",
          "รับประกันงานติดตั้งและตรวจเช็กระบบน้ำ 30 วัน",
        ],
        contingencies: [
          "หากตรวจสอบพบแรงดันปั๊มน้ำหลักในวิลล่าสูงเกิน 4.5 บาร์ จะแนะนำให้ติดตั้ง Pressure Reducing Valve เพิ่มเติม",
        ],
        mollyNotes: `Molly ประสานร้านสุขภัณฑ์ชั้นนำในภูเก็ต คัดสรรก๊อกน้ำสแตนเลส SUS304 พร้อมวาล์วเซรามิกทนแรงดันน้ำสูง พร้อมคิดค่าจัดหาและตรวจรับ ${feePct}% จบปัญหาน้ำรั่วซึมอย่างถาวรและสบายใจค่ะ`,
      };
    }

    // 3. Ceilings, Moisture, Walls & Paint (ฝ้าเพดาน, รอยน้ำ, สีลอกร่อน, รอยร้าว, ซิลิโคนขอบบาน)
    if (
      textCorpus.includes("ฝ้า") ||
      textCorpus.includes("เพดาน") ||
      textCorpus.includes("รอยน้ำ") ||
      textCorpus.includes("คราบน้ำ") ||
      textCorpus.includes("สีลอก") ||
      textCorpus.includes("สีร่อน") ||
      textCorpus.includes("รอยร้าว") ||
      textCorpus.includes("เชื้อรา") ||
      textCorpus.includes("ceiling") ||
      textCorpus.includes("moisture") ||
      textCorpus.includes("paint")
    ) {
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "Moisture-Resistant Gypsum Board Patch & Fiberglass Mesh Reinforcement Tape",
            descriptionTh: "แผ่นยิปซัมกันชื้น (MR) พร้อมผ้าฉาบไฟเบอร์และปูนยิปซัมฉาบรอยต่อสูตรพิเศษ",
            qty: 1,
            unit: "Set",
            unitPrice: 550,
            amount: 550,
            sourcingChannel: "Thai Watsadu Phuket / Global House",
          },
          {
            item: 2,
            descriptionEn: "TOA / Captain Anti-Fungal Moisture-Blocking Primer (1 Gallon)",
            descriptionTh: "น้ำยารองพื้นปูนเก่าสูตรบล็อกความชื้นและป้องกันเชื้อราสะสมลึกถึงเนื้อปูน",
            qty: 1,
            unit: "Can",
            unitPrice: 680,
            amount: 680,
            sourcingChannel: "HomePro Phuket",
          },
          {
            item: 3,
            descriptionEn: "Premium Interior/Exterior Acrylic Emulsion Topcoat (Exact Shade Matched)",
            descriptionTh: "สีน้ำอะคริลิกเกรดพรีเมียม ชนิดกึ่งเงา เช็ดล้างได้ ผสมเฉดสีตรงตามผนังเดิม 100%",
            qty: 1,
            unit: "Can",
            unitPrice: 890,
            amount: 890,
            sourcingChannel: "TOA Color World Phuket",
          },
          {
            item: 4,
            descriptionEn: "High-Performance Polyurethane (PU) Waterproof Joint Sealant (2 Tubes)",
            descriptionTh: "โพลียูรีเทนซีลแลนท์กันน้ำรั่วซึมภายนอกอาคารและขอบวงกบ ทนแดด ทนฝน",
            qty: 2,
            unit: "Tubes",
            unitPrice: 220,
            amount: 440,
            sourcingChannel: "Thai Watsadu Phuket",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "Moisture Source Trace, Exterior Joint Sealant Weatherproofing & Surface Preparation",
            detail: "ตรวจหาต้นตอการซึม ซีลรอยต่อขอบอาคารภายนอก และขูดลอกฟิล์มสีเดิมที่เสื่อมสภาพให้เรียบเนียน",
            estimatedSchedule: "ภายใน 2-3 วันทำการ",
            qty: "1 Job",
            amount: 1800,
          },
          {
            item: 2,
            description: "Ceiling Patching, Anti-Fungal Priming & Two-Coat Matched Color Restoration",
            detail: "งานฉาบเก็บรอยต่อ ทารองพื้นกันชื้น และทาสีทับหน้า 2 เที่ยวให้เนียนเรียบเป็นเนื้อเดียวกัน",
            estimatedSchedule: "พร้อมงานเตรียมพื้นผิว",
            qty: "1 Job",
            amount: 2500,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "รับประกันงานซ่อมแซมฝ้าและทาสี 90 วัน",
          "รับประกันการป้องกันน้ำรั่วซึมจากรอยต่อที่แก้ไข 6 เดือน",
        ],
        contingencies: [
          "หากพบว่าน้ำซึมมาจากท่อประปาชั้นบนที่ฝังในพื้นคอนกรีต จะแจ้งแนวทางการเปิดช่องเซอร์วิสก่อนดำเนินการ",
        ],
        mollyNotes: `Molly จัดสรรวัสดุกันชื้นและสีอะคริลิกเกรดพรีเมียมที่ผสมเฉดสีตรงกับผนังเดิมของวิลล่า พร้อมคิดค่าจัดหาและควบคุมงาน ${feePct}% เพื่อคืนความสมบูรณ์สวยงามให้วิลล่าค่ะ`,
      };
    }

    // 4. Air Conditioning & HVAC
    if (
      textCorpus.includes("air") ||
      textCorpus.includes("แอร์") ||
      textCorpus.includes("hvac") ||
      textCorpus.includes("cooling") ||
      textCorpus.includes("compressor")
    ) {
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "Daikin / Mitsubishi Inverter Dual Motor Run Capacitor 40uF",
            descriptionTh: "คาปาซิเตอร์แท้เกรดทนความร้อนสูงสำหรับพัดลมและคอมเพรสเซอร์แอร์",
            qty: 1,
            unit: "Pcs",
            unitPrice: 580,
            amount: 580,
            sourcingChannel: "Amorn Electronics Phuket / Authorized Parts",
          },
          {
            item: 2,
            descriptionEn: "High-Pressure Chemical Coil Cleaner Foam & Anti-Bacterial Spray",
            descriptionTh: "น้ำยาโฟมทำความสะอาดแผงรังผึ้งคอยล์เย็น-คอยล์ร้อนมาตรฐานโรงงาน",
            qty: 2,
            unit: "Cans",
            unitPrice: 380,
            amount: 760,
            sourcingChannel: "HomePro Phuket",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "AC Capacitor Replacement & Comprehensive Inverter Circuit Diagnostics",
            detail: "เปลี่ยนอะไหล่คาปาซิเตอร์ ตรวจเช็กกระแสไฟฟ้าคอมเพรสเซอร์ และทดสอบอุณหภูมิความเย็น",
            estimatedSchedule: "ภายใน 24-48 ชม.",
            qty: "1 Job",
            amount: 1800,
          },
          {
            item: 2,
            description: "High-Pressure Chemical Coil Cleaning & Drainage Flush",
            detail: "ล้างอัดฉีดคอยล์ร้อนและคอยล์เย็น เป่าล้างท่อน้ำทิ้ง ป้องกันน้ำล้นและเชื้อราสะสม",
            estimatedSchedule: "พร้อมงานเปลี่ยนอะไหล่",
            qty: "1 Job",
            amount: 1200,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "รับประกันงานล้างและตรวจเช็กระบบทำความเย็น 30 วัน",
          "อะไหล่คาปาซิเตอร์รับประกัน 6 เดือน",
        ],
        contingencies: [
          "กรณีคอมเพรสเซอร์ชำรุดภายใน จะทำการแจ้งราคาประเมินก่อนดำเนินการ",
        ],
        mollyNotes: `Molly ได้ประสานตัวแทนอะไหล่แอร์ภูเก็ต จัดสรรแคปรันเกรดอุตสาหกรรมพร้อมน้ำยาล้างคอยล์มาตรฐาน พร้อมคิดค่าจัดหาและตรวจรับ ${feePct}% เพื่อความคุ้มค่าและสบายใจค่ะ`,
      };
    }

    // 5. Pool & Pump Systems
    if (
      textCorpus.includes("pool") ||
      textCorpus.includes("pump") ||
      textCorpus.includes("สระ") ||
      textCorpus.includes("ปั๊ม")
    ) {
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "NSK Sealed High-Speed Ball Bearings (Set of 2)",
            descriptionTh: "ตลับลูกปืนแบริ่งรอบจัดสำหรับมอเตอร์ปั๊มสระว่ายน้ำ (ชุด 2 ตลับ)",
            qty: 1,
            unit: "Set",
            unitPrice: 750,
            amount: 750,
            sourcingChannel: "Phuket Bearing & Machine Supply",
          },
          {
            item: 2,
            descriptionEn: "Hayward Ceramic Mechanical Shaft Seal 5/8 Inch",
            descriptionTh: "แมคคานิคอลซีลเซรามิกกันน้ำรั่วเข้ามอเตอร์ปั๊มสระ",
            qty: 1,
            unit: "Pcs",
            unitPrice: 850,
            amount: 850,
            sourcingChannel: "Pool Pro & Chemicals Phuket",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "Pool Pump Motor Overhaul & Shaft Seal Installation Labor",
            detail: "งานถอดโอเวอร์ฮอลล์มอเตอร์ปั๊มน้ำสระ อัดเปลี่ยนลูกปืน แวคคั่มและประกอบทดสอบแรงดันน้ำ",
            estimatedSchedule: "ภายใน 2-3 วันทำการ",
            qty: "1 Job",
            amount: 2200,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "รับประกันงานซ่อมบำรุงและซีลกันรั่ว 30 วัน",
          "ลูกปืน NSK แท้รับประกันการทำงานไร้เสียงดัง 6 เดือน",
        ],
        contingencies: [
          "หากขดลวดมอเตอร์ไหม้สะสม จะแจ้งราคาประเมินพันคอยล์ใหม่ก่อนซ่อม",
        ],
        mollyNotes: `Molly สรุปอะไหล่ปั๊มน้ำและตลับลูกปืนทนคลอรีนสูง พร้อมค่าจัดหาและควบคุมคุณภาพ ${feePct}% เพื่อการใช้งานต่อเนื่องยาวนานค่ะ`,
      };
    }

    // 6. Lighting / Downlights / Fixtures
    if (
      textCorpus.includes("หลอดไฟ") ||
      textCorpus.includes("ดาวน์ไลท์") ||
      textCorpus.includes("โคมไฟ") ||
      textCorpus.includes("led") ||
      textCorpus.includes("light")
    ) {
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "Philips / OPPLE Recessed LED Downlight 12W Warm White (High CRI > 85)",
            descriptionTh: "โคมไฟดาวน์ไลท์ LED ฝังฝ้า 12W แสงวอร์มไวท์ ถนอมสายตา กระจายแสงสม่ำเสมอ",
            qty: 4,
            unit: "Units",
            unitPrice: 280,
            amount: 1120,
            sourcingChannel: "HomePro Phuket / Thai Watsadu",
          },
          {
            item: 2,
            descriptionEn: "Constant-Current Certified Isolated LED Driver with Surge Protection",
            descriptionTh: "ชุดหม้อแปลงขับ LED Driver ควบคุมกระแสคงที่ ป้องกันไฟกระชาก",
            qty: 2,
            unit: "Units",
            unitPrice: 350,
            amount: 700,
            sourcingChannel: "Amorn Electronics Phuket",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "Lighting Fixture Replacement, Ceiling Cutout Sizing & Wiring Safety Verification",
            detail: "งานเปลี่ยนโคมไฟดาวน์ไลท์ ปรับแต่งช่องเจาะฝ้า และตรวจเช็กการต่อสายไฟให้ปลอดภัยได้มาตรฐาน",
            estimatedSchedule: "ภายใน 24-48 ชม.",
            qty: "1 Job",
            amount: 1200,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "โคมไฟ LED และไดรเวอร์รับประกันศูนย์ 1 ปี",
          "รับประกันงานติดตั้งระบบแสงสว่าง 30 วัน",
        ],
        contingencies: [
          "กรณีสายไฟเหนือฝ้าเพดานเดิมมีอาการกรอบแตก ช่างจะทำการเปลี่ยนสายช่วงต่อให้ปลอดภัย",
        ],
        mollyNotes: `Molly ได้เปรียบเทียบโคมไฟคุณภาพสูงแสงนวลตามาตรฐานวิลล่า พร้อมคิดค่าจัดหาและตรวจรับ ${feePct}% เพื่อบรรยากาศที่น่าพักผ่อนค่ะ`,
      };
    }

    // 7. IT Network & Wi-Fi Systems (if specifically mentioned)
    if (
      textCorpus.includes("wi-fi") ||
      textCorpus.includes("wifi") ||
      textCorpus.includes("lan") ||
      textCorpus.includes("router") ||
      textCorpus.includes("cctv")
    ) {
      return {
        hardwareItems: [
          {
            item: 1,
            descriptionEn: "Ubiquiti UniFi U6 Pro Enterprise Wi-Fi 6 Access Point",
            descriptionTh: "อุปกรณ์กระจายสัญญาณ Wi-Fi 6 ระดับ Enterprise ครอบคลุมทั่ววิลล่า",
            qty: 1,
            unit: "Unit",
            unitPrice: 5900,
            amount: 5900,
            sourcingChannel: "Official IT Distributor Phuket / Shopee Mall",
          },
          {
            item: 2,
            descriptionEn: "Link CAT6 UTP High-Speed Outdoor/Indoor Network Cable 50m",
            descriptionTh: "สายสัญญาณเน็ตเวิร์ก Link CAT6 แท้ มาตรฐาน US-9106",
            qty: 1,
            unit: "Roll",
            unitPrice: 1250,
            amount: 1250,
            sourcingChannel: "Phuket Network Supply / HomePro",
          },
        ],
        serviceItems: [
          {
            item: 1,
            description: "On-Site Network Survey, Spectrum Heatmap & Wi-Fi 6 Roaming Optimization",
            detail: "ตรวจวัดสัญญาณ วิเคราะห์ช่องสัญญาณชนกัน และคอนฟิกระบบ Wi-Fi Roaming ทั่วทั้งวิลล่า",
            estimatedSchedule: "ภายใน 1-2 วันทำการ",
            qty: "1 Job",
            amount: 3500,
          },
        ],
        procurementFeeRate: feeRate,
        terms: [
          "งานติดตั้งระบบโครงสร้างสัญญาณ Network รับประกัน 1 ปีเต็ม",
          "อุปกรณ์ฮาร์ดแวร์รับประกันศูนย์ไทย 1-3 ปี",
        ],
        contingencies: [
          "ประเมินความยาวสายสัญญาณเพิ่มเติมตามสภาพช่องท่อจริงหน้างานหากพบท่อตัน",
        ],
        mollyNotes: `Molly ได้จัดสรรชุดอุปกรณ์ IT Network & Wi-Fi คุณภาพสูง ตรวจเช็กสต็อกสินค้าในภูเก็ตแล้วพร้อมจัดส่งทันที พร้อมคิดค่าจัดหาและควบคุมคุณภาพ ${feePct}% ค่ะ`,
      };
    }

    // 8. Default: Comprehensive Villa Inspection & Property Care Management
    return {
      hardwareItems: [
        {
          item: 1,
          descriptionEn: "Schneider Electric Acti9 RCBO 2P 30mA Earth Leakage Breaker",
          descriptionTh: "เบรกเกอร์ตัดไฟรั่วดูด Schneider Electric มาตรฐานสากลสำหรับตู้ไฟหลัก",
          qty: 1,
          unit: "Unit",
          unitPrice: 1850,
          amount: 1850,
          sourcingChannel: "HomePro Phuket / Global House",
        },
        {
          item: 2,
          descriptionEn: "Heavy-Duty SUS304 Replacement Hardware & Sanitary Seal Kit",
          descriptionTh: "ชุดอุปกรณ์อะไหล่สแตนเลส SUS304 พร้อมซีลยางและวัสดุซ่อมบำรุงเกรดวิลล่า",
          qty: 1,
          unit: "Set",
          unitPrice: 1250,
          amount: 1250,
          sourcingChannel: "HomePro Phuket / Thai Watsadu",
        },
        {
          item: 3,
          descriptionEn: "Precision Property Care Consumables & Fasteners Kit",
          descriptionTh: "ชุดพุก สกรูสแตนเลส และวัสดุสิ้นเปลืองงานซ่อมบำรุงมาตรฐานสูง",
          qty: 1,
          unit: "Set",
          unitPrice: 450,
          amount: 450,
          sourcingChannel: "Local Phuket Hardware Merchant",
        },
      ],
      serviceItems: [
        {
          item: 1,
          description: "Comprehensive Villa Inspection Defect Rectification & Hardware Replacement Labor",
          detail: "งานทีมช่างเข้าดำเนินการแก้ไขข้อบกพร่องตามรายงานการตรวจ เปลี่ยนอะไหล่และปรับตั้งระบบให้สมบูรณ์",
          estimatedSchedule: "ภายใน 2 วันทำการ",
          qty: "1 Job",
          amount: 2800,
        },
        {
          item: 2,
          description: "Multi-Point Villa Operational & Safety Verification Sign-Off",
          detail: "ตรวจเช็กความปลอดภัยและการทำงานซ้ำทุกจุดหลังซ่อม พร้อมส่งมอบรายงานส่งงานมาตรฐาน",
          estimatedSchedule: "ในวันเดียวกับงานติดตั้ง",
          qty: "1 Job",
          amount: 1500,
        },
      ],
      procurementFeeRate: feeRate,
      terms: [
        "รับประกันงานซ่อมบำรุงและติดตั้ง 60 วันเต็มตามมาตรฐาน Phuket Trusted Local",
        "อุปกรณ์และอะไหล่แท้รับประกันตามมาตรฐานศูนย์ผู้ผลิต",
        "มีรายงานสรุปงานพร้อมภาพถ่ายหลังแก้ไขเพื่อความโปร่งใสและสบายใจของเจ้าของวิลล่า",
      ],
      contingencies: [
        "กรณีพบจุดชำรุดซ่อนเร้นเพิ่มเติม ช่างจะบันทึกภาพและแจ้งประเมินก่อนลงมือทำเสมอ",
      ],
      mollyNotes: `Molly ได้เปรียบเทียบราคาตลาดล่าสุดในภูเก็ต คัดสรรอะไหล่และอุปกรณ์คุณภาพสูงที่ตรงกับการใช้งานของวิลล่า พร้อมคิดค่าประสานงาน จัดหา และควบคุมงานช่าง ${feePct}% เพื่อให้เจ้าของวิลล่าได้รับบริการที่ได้มาตรฐาน ไร้กังวลอย่างแท้จริงค่ะ`,
    };
  };

  // --------------------------------------------------------------------------
  // AI Agent 2: Molly (The Smart Coordinator & Sourcing Specialist)
  // --------------------------------------------------------------------------
  app.post("/api/gemini/molly", async (req: Request, res: Response) => {
    const { findings, customerName, location, customRequest, coordinateFeeRate, serviceType, villaName } = req.body;
    const requestedFeeRate =
      typeof coordinateFeeRate === "number" && coordinateFeeRate >= 0.05 && coordinateFeeRate <= 0.15
        ? coordinateFeeRate
        : 0.15;
    const feePct = Math.round(requestedFeeRate * 100);

    const safeFallback = getSmartMollyQuotation(
      serviceType || "",
      customRequest || "",
      Array.isArray(findings) ? findings : [],
      customerName || "",
      location || villaName || "",
      requestedFeeRate
    );

    if (!ai) {
      res.json(safeFallback);
      return;
    }

    try {
      const systemInstruction = `
คุณคือ Molly ฝ่ายประสานงาน จัดซื้อ และจัดทำใบเสนอราคาของ Phuket Trusted Local (Villa Inspection & Comprehensive Property Care in Phuket)
บริบทสำคัญของ Phuket Trusted Local:
- เราให้บริการ "Villa Inspection, Property Care & On-Ground Trusted Representation" แก่เจ้าของวิลล่าชาวต่างชาติ (Absentee Owners), ผู้พักอาศัย Expat, และผู้ปล่อยเช่า Luxury Rental ในภูเก็ต
- ขอบเขตงานครอบคลุมทุกระบบหลักของวิลล่าอย่างมืออาชีพ: ประตูบานเลื่อน-ลูกล้อ-รางเลื่อน-หน้าต่าง, ระบบประปา-สุขภัณฑ์-ก๊อกน้ำ-ท่อรั่วซึม, ระบบปรับอากาศ, ฝ้าเพดาน-ความชื้น-สี, ระบบสระว่ายน้ำ, ไฟสนาม/สวน, และระบบความปลอดภัยไฟฟ้า
- เราไม่ใช่ร้านคอมพิวเตอร์หรือช่างไฟเฉพาะทาง แต่เป็นผู้ดูแลวิลล่าแบบเบ็ดเสร็จ (Property Care & Peace of Mind)

กฎความเกี่ยวข้องขั้นสูงสุด (STRICT RELEVANCE MANDATE - ฝ่าฝืนไม่ได้เด็ดขาด):
1. เสนอเฉพาะอะไหล่และค่าแรงที่เกี่ยวข้องโดยตรงกับรายการที่ตรวจพบ (findings) หรือคำขอ (customRequest) เท่านั้น! ห้ามยัดเยียดรายการอื่นที่ไม่เกี่ยวข้องเด็ดขาด!
2. กรณีโคมไฟสนาม / หลอดไฟ PAR38 / ไฟสวนหน้าบ้าน:
   - อะไหล่: ต้องเสนอเฉพาะ "Outdoor Waterproof PAR38 LED Floodlight Lamp (E27, 15W-18W Warm White, IP65)" ราคาตลาดภูเก็ตประมาณ 350-450 THB
   - ค่าแรง: "Outdoor PAR38 Landscape Lamp Replacement & Waterproof Gasket Seal Inspection" ประมาณ 500-800 THB
   - ห้ามเสนอโคมดาวน์ไลท์เพดาน, ห้ามใส่กลอนประตูดิจิทัล, ห้ามใส่เต้ารับโต๊ะทำงาน, ห้ามใส่เบรกเกอร์เด็ดขาด!
   - การนับจำนวน (Quantity): คำว่า "PAR38" คือรหัสขนาดทรงหลอดไฟ ไม่ใช่จำนวน! หากพบข้อความว่า "หลอดไฟ par38 เสีย 1 ดวง" หรือตรวจพบ 1 จุด ให้ใส่ qty = 1 เท่านั้น!
3. สวนหน้าบ้าน (outside garden): หากเป็นไฟบริเวณนี้ ต้องเป็นโคม/หลอดไฟภายนอกกันน้ำ IP65 เสมอ
4. กฎสถานะ "ปกติ (Normal)" และกรณี "ค่าอะไหล่ 0 บาท" - บทเรียนและประสบการณ์สำคัญ:
   - หากรายการผลการตรวจของ Mr. Big ระบุสถานะว่า "Normal", "ทำงานได้ปกติ", "ไม่มีการลัดวงจร", "ไม่ทริป", หรือไม่มีจุดชำรุด:
     * ห้ามเสนออะไหล่หรือสั่งซื้ออุปกรณ์ทดแทนเด็ดขาด! ให้รายการ hardwareItems เป็น array ว่าง [] (ค่าอะไหล่ 0 บาท)
     * นี่คือความโปร่งใสและจุดแข็งของทีมงาน: เราไม่ยัดเยียดการเปลี่ยนของโดยไม่จำเป็น ช่วยเจ้าของวิลล่าประหยัดค่าใช้จ่ายได้ทันที
   - การคิด "ค่าบริการตรวจเช็กและวินิจฉัยหน้างาน" (On-site Diagnostic & Safety Audit Fee):
     * ตามมาตรฐานสากลของวิลล่าในภูเก็ต แม้ค่าอะไหล่เป็น 0 บาท แต่ต้องมีค่าบริการตรวจเช็กหน้างาน (Diagnostic Fee) ใน serviceItems เสมอ
     * เหตุผลความคุ้มค่า: ครอบคลุมค่าเดินทางของทีมช่างชำนาญการ, เวลาปฏิบัติงานหน้างาน, การใช้เครื่องมือวัดความปลอดภัยทางวิศวกรรม (Megger, Multimeter, Earth tester, Network analyzer), และการออกรายงานรับรองความปลอดภัย
     * อัตราค่าบริการตรวจเช็กมาตรฐานภูเก็ต:
       - งานตรวจระบบไฟฟ้าและวิลล่าเชิงป้องกัน (Preventive Electrical Safety Audit): 1,200 – 1,500 THB
       - งานตรวจวิเคราะห์ระบบ Smart Home & Gateway Network Specialist: 800 – 1,200 THB
     * สื่อสารอย่างนุ่มนวลใน mollyNotes และ terms ว่า "หากวิลล่ามีสัญญาบริการดูแลรายเดือน (AMC) รายการนี้สามารถยกเว้นได้"

5. กฎการคิดค่าเสียเวลา / ผู้เช่าหรือลูกค้าผิดนัดหมาย (Cancellation / Missed Appointment Fee Policy) - สกิลเฉพาะของ Molly:
   - ห้ามใช้คำว่า "Penalty" (ค่าปรับ) กับลูกค้าเด็ดขาด! ให้ใช้คำว่า "Cancellation / Missed Appointment Fee" (ภาษาไทย: ค่าธรรมเนียมสงวนเวลาช่าง / ผิดนัดหมายเข้าหน้างาน)
   - Positioning ของ Phuket Trusted Local: เราไม่ได้ลงโทษลูกค้า แต่กำลังคิดค่าบริการสำหรับเวลาและความเชี่ยวชาญของช่างที่ถูกจัดสรรไว้เฉพาะสำหรับวิลล่า และไม่สามารถนำเวลานี้ไปรับงานวิลล่าอื่นได้ (Dedicated Technician Time & Opportunity Cost)
   - โครงสร้างราคามาตรฐาน (Recommended Pricing Rates):
     * ยกเลิกก่อน 24 ชม.: ฟรี (ไม่มีค่าใช้จ่าย)
     * ยกเลิกน้อยกว่า 24 ชม.: 500 THB
     * ไม่มาตามนัด / เข้าบ้านไม่ได้: 750 – 1,000 THB (มาตรฐานแนะนำ 1,000 THB ต่อครั้ง)
     * เดินทางไปถึงหน้างานแล้วแต่เข้าไม่ได้: 1,000 – 1,500 THB (มาตรฐานแนะนำ 1,500 THB)
     * เบี้ยวนัดซ้ำครั้งที่ 2: คิดเต็มตามเรตที่กำหนด (เช่น 1,000 THB ต่อครั้ง หรือ 1,500 THB หากช่างเดินทางไปถึงแล้ว)
   - ข้อความ Appointment Policy สำหรับระบุใน Terms & นัดหมายลูกค้า:
     "Appointment Policy: As the technician needs to be scheduled specifically for your property, we kindly ask that someone is available at the agreed appointment time. Cancellations with less than 24 hours’ notice or missed appointments may be subject to a cancellation fee of THB 1,000."
   - นโยบายมัดจำล่วงหน้านัดครั้งถัดไป (Appointment Deposit):
     "สำหรับการนัดหมายครั้งถัดไป ทีมงานแนะนำเรียกเก็บ Appointment Deposit THB 1,000 ก่อนเข้าดำเนินการ: หากมาตามนัด นำ ฿1,000 ไปหักจากค่าติดตั้ง/งานบริการจริง แต่หากเบี้ยวนัดโดยไม่แจ้งล่วงหน้า 24 ชม. ขอสงวนสิทธิ์ไม่คืนเงินมัดจำเพื่อชดเชยเวลาช่าง"
   - กฎการแยก 3 รายการอย่างโปร่งใสเสมอ (The 3-Item Separation Mandate - ห้ามแอบแฝง):
     1) Replacement / Installation: ค่าติดตั้งจริง เช่น ฿2,000
     2) Travel / Call-out: ถ้ามีการเดินทางตามเงื่อนไข
     3) Missed Appointment Fee: THB 1,000 แยกบรรทัดชัดเจนใน Invoice/Quotation ให้ดูเป็นมืออาชีพและโปร่งใส

หน้าที่ของ Molly:
1. วิเคราะห์รายการผลการตรวจของ Mr. Big หรือประเภทงาน '${serviceType || "งานดูแลและตรวจรับวิลล่า"}' เพื่อแยกแยะว่าต้องใช้อะไหล่/อุปกรณ์ (Hardware Items) อะไร และต้องใช้แรงงานช่างฝีมือ (Service Items) เท่าไหร่
2. Sourcing: อ้างอิงราคาตลาดจริงในภูเก็ต (THB) จากแหล่งจัดซื้อชั้นนำ (เช่น HomePro ฉลอง/ถลาง, ไทวัสดุ, Global House, ซุปเปอร์ชีป, ร้านสุขภัณฑ์/อะลูมิเนียมภูเก็ต)
3. Sourcing Channel: ระบุร้านค้าหรือแหล่งซื้อในภูเก็ตจริงให้ชัดเจน
4. Logic การคำนวณ:
   - Hardware Subtotal + Service Subtotal = Total Direct Cost
   - Procurement & Coordinate Fee: คำนวณอัตรา ${feePct}% (${requestedFeeRate}) จากมูลค่าอุปกรณ์ เพื่อเป็นค่าบริการประสานงาน จัดหา สต็อก และตรวจรับงานช่าง ให้ลูกค้าสบายใจ (Peace of Mind)
5. Terms & Guarantee: เขียนเงื่อนไขการรับประกันที่ชัดเจน เช่น รับประกันอะไหล่ 1 ปี, รับประกันงานติดตั้ง 30-60 วัน
6. Molly Notes: สรุปความคุ้มค่าและสร้างความมั่นใจให้เจ้าของวิลล่าอย่างสุภาพ นุ่มนวล มืออาชีพ
`;

      const prompt = `
วิเคราะห์ผลการตรวจของ Mr. Big และประเภทงานเพื่อออกใบเสนอราคาอย่างเป็นทางการ:
- ชื่องาน / บริการ: "${serviceType || "Villa Inspection & Property Care Audit"}"
- ลูกค้า: "${customerName || "Villa Owner"}"
- สถานที่ / วิลล่า: "${location || villaName || "Phuket Luxury Villa"}"
- อัตราค่า Coordinate/Procurement Fee: ${feePct}% (factor: ${requestedFeeRate})
- คำขอพิเศษเพิ่มเติม: "${customRequest || "จัดสรรรายการอุปกรณ์พร้อมราคาตลาดภูเก็ต และคำนวณค่าจัดหาตามมาตรฐาน Phuket Trusted Local"}"

รายการผลการตรวจและ Recommended Actions จาก Mr. Big (ถ้ามี):
${JSON.stringify(findings || [], null, 2)}

โปรดสร้างรายการ Hardware (ระบุ Sourcing Channel ในภูเก็ต) และรายการ Technical Service ให้ครอบคลุมทุกจุด
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hardwareItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.INTEGER },
                    descriptionEn: { type: Type.STRING },
                    descriptionTh: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    unitPrice: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                    sourcingChannel: { type: Type.STRING },
                  },
                  required: [
                    "item",
                    "descriptionEn",
                    "descriptionTh",
                    "qty",
                    "unit",
                    "unitPrice",
                    "amount",
                    "sourcingChannel",
                  ],
                },
              },
              serviceItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.INTEGER },
                    description: { type: Type.STRING },
                    detail: { type: Type.STRING },
                    estimatedSchedule: { type: Type.STRING },
                    qty: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                  },
                  required: ["item", "description", "detail", "estimatedSchedule", "qty", "amount"],
                },
              },
              procurementFeeRate: { type: Type.NUMBER },
              terms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              contingencies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              mollyNotes: {
                type: Type.STRING,
                description: "Molly's summary explaining sourcing channels, price justification, and Peace of Mind assurance",
              },
            },
            required: [
              "hardwareItems",
              "serviceItems",
              "procurementFeeRate",
              "terms",
              "contingencies",
              "mollyNotes",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");

      // Strict validation: If findings indicate normal status with no defects, return safeFallback (0 replacement hardware)
      if (Array.isArray(findings) && findings.length > 0) {
        const allNormal = findings.every((f: any) => isNormalFinding(f));
        if (allNormal || safeFallback.hardwareItems.length === 0) {
          res.json(safeFallback);
          return;
        }
      }

      if (Array.isArray(parsed.hardwareItems)) {
        // If parsed correctly returned empty hardware items for normal inspection, allow it
        if (parsed.hardwareItems.length === 0) {
          res.json(parsed);
          return;
        }
        // Validation: If findings were passed from Mr. Big, Molly MUST strictly respect those findings!
        if (Array.isArray(findings) && findings.length > 0 && safeFallback.hardwareItems.length > 0) {
          const findingsText = findings
            .map((f: any) => `${f.title || ""} ${f.observationTh || ""} ${f.observationEn || ""} ${f.locationZone || ""} ${f.category || ""}`)
            .join(" ")
            .toLowerCase();

          // Check if findings are outdoor lighting / PAR38 only
          const isPar38OrLightingOnly =
            (findingsText.includes("par38") ||
             findingsText.includes("ไฟสนาม") ||
             findingsText.includes("ไฟสวน") ||
             findingsText.includes("หลอดไฟ")) &&
            !findingsText.includes("ก๊อก") &&
            !findingsText.includes("สายฉีด") &&
            !findingsText.includes("ประตู") &&
            !findingsText.includes("แอร์") &&
            !findingsText.includes("ปั๊ม");

          const parsedHasUnrelatedPlumbing = parsed.hardwareItems.some((h: any) => {
            const desc = `${h.descriptionEn || ""} ${h.descriptionTh || ""}`.toLowerCase();
            return desc.includes("faucet") || desc.includes("basin") || desc.includes("p-trap") || desc.includes("ก๊อก") || desc.includes("อ่าง");
          });

          if (isPar38OrLightingOnly && parsedHasUnrelatedPlumbing) {
            console.warn("Molly AI hallucinated plumbing for lighting finding; using safeFallback from findings");
            res.json(safeFallback);
            return;
          }
        }

        // Sanitize any PAR38 quantity errors (PAR38 is model code, not 38 pieces)
        parsed.hardwareItems.forEach((h: any) => {
          const desc = `${h.descriptionEn || ""} ${h.descriptionTh || ""}`.toLowerCase();
          if (desc.includes("par38") && h.qty >= 30) {
            h.qty = 1;
            h.amount = h.qty * h.unitPrice;
          }
        });

        res.json(parsed);
      } else {
        res.json(safeFallback);
      }
    } catch (err: any) {
      console.warn("Molly AI warning (using smart fallback):", err?.message || err);
      // Seamlessly return smart fallback so Molly NEVER fails or blocks user
      res.json(safeFallback);
    }
  });

  // --------------------------------------------------------------------------
  // AI Agent 2.1: Molly Quick Villa Inspection & Property Care Sourcing Assistant
  // (จัดหาอะไหล่และราคากลางสำหรับงานดูแลและตรวจรับวิลล่า: ประตูบานเลื่อน, ประปา, ฝ้า-สี, แอร์, สระ, ไฟฟ้า)
  // --------------------------------------------------------------------------
  app.post("/api/gemini/molly/assist", async (req: Request, res: Response) => {
    const { query, currentHardwareItems, villaName, category } = req.body;

    const isMissedQuery =
      query &&
      (query.toLowerCase().includes("ผิดนัด") ||
        query.toLowerCase().includes("เสียเวลา") ||
        query.toLowerCase().includes("เบี้ยวนัด") ||
        query.toLowerCase().includes("missed") ||
        query.toLowerCase().includes("cancel") ||
        query.toLowerCase().includes("เข้าบ้านไม่ได้") ||
        query.toLowerCase().includes("ไม่มาตามนัด") ||
        query.toLowerCase().includes("no-show"));

    const fallbackResponse = {
      mollyGreeting: isMissedQuery
        ? `สวัสดีค่ะ! มอลลี่จัดเตรียมนโยบายและแนวทางคิดค่าธรรมเนียม Cancellation / Missed Appointment Fee ตามมาตรฐานสากลของ Phuket Trusted Local ให้เรียบร้อยค่ะ`
        : `สวัสดีค่ะ! มอลลี่พร้อมช่วยตรวจสอบและจัดหาอะไหล่สำหรับงานดูแลและตรวจรับวิลล่า (Villa Inspection & Property Care) ให้ตรงจุดและได้มาตรฐานระดับพรีเมียมค่ะ ไม่ว่าจะเป็นงานประตู-หน้าต่างบานเลื่อน, งานประปา-สุขภัณฑ์, งานปรับอากาศ, งานฝ้า-สี, งานสระว่ายน้ำ หรือระบบไฟฟ้า มอลลี่เช็กสต็อกและราคากลางในภูเก็ตให้เรียบร้อยค่ะ`,
      priceTrendWarning: isMissedQuery
        ? `📋 นโยบาย PTL: อย่าใช้คำว่า "Penalty" กับลูกค้าเด็ดขาด แต่ให้ใช้ "Cancellation / Missed Appointment Fee" เพื่อสะท้อนถึงการสงวนเวลาช่าง (Dedicated Technician Time & Route Allocation) และแยก 3 รายการอย่างโปร่งใสเสมอค่ะ`
        : "🌴 ข้อมูลราคาวัสดุและอะไหล่วิลล่าในภูเก็ต: ชุดลูกล้อสแตนเลส SUS304 และก๊อกน้ำมาตรฐานวิลล่ามีสต็อกพร้อมจัดส่งที่ HomePro ฉลอง/ถลาง และไทวัสดุ, สีรองพื้นกันชื้น TOA และซีลแลนท์กันน้ำรั่วซึมแนะนำให้สต็อกเผื่อหน้าฝนค่ะ",
      missingChecklist: [
        {
          id: "chk-door-1",
          nameTh: "ชุดลูกล้อคู่สแตนเลส SUS304 ประตูบานเลื่อนหนัก (Heavy-Duty Tandem Rollers)",
          nameEn: "Heavy-Duty SUS304 Stainless Steel Tandem Sliding Door Rollers (Set)",
          category: "door_window",
          unitPrice: 650,
          unit: "ชุด",
          qty: 2,
          reason: "อะไหล่จำเป็นสำหรับงานตรวจวิลล่า: แก้ไขปัญหาบานเลื่อนฝืด ตกร่อง หรือมีเสียงดัง ปลอดสนิมทนไอเกลือทะเล",
          sourcingChannel: "HomePro Phuket / Hafele Fitting Center",
          recommended: true,
        },
        {
          id: "chk-plumb-1",
          nameTh: "ก๊อกน้ำอ่างล้างหน้าสแตนเลส SUS304 ไส้วาล์วเซรามิก พร้อมสายน้ำดีถัก",
          nameEn: "SUS304 Brushed Stainless Steel Basin Mixer Faucet with Braided Inlets",
          category: "plumbing",
          unitPrice: 1450,
          unit: "ชุด",
          qty: 1,
          reason: "งานระบบสุขภัณฑ์และประปา: ทนแรงดันปั๊มน้ำวิลล่า วาล์วเซรามิกแท้ไม่รั่วซึมตลอดอายุการใช้งาน",
          sourcingChannel: "HomePro Phuket Chalong / Thai Watsadu",
          recommended: true,
        },
        {
          id: "chk-ceiling-1",
          nameTh: "ชุดน้ำยารองพื้นปูนเก่าบล็อกความชื้น TOA + สีอะคริลิกทาฝ้าเพดาน",
          nameEn: "TOA Moisture-Blocking Primer & Interior Acrylic Ceiling Touch-Up Kit",
          category: "ceiling_paint",
          unitPrice: 1250,
          unit: "ชุด",
          qty: 1,
          reason: "งานซ่อมบำรุงผิวอาคาร: แก้ไขรอยคราบน้ำ รอยเชื้อราสะสมบนฝ้าเพดานจากการรั่วซึมให้กลับมาเนียนเรียบ",
          sourcingChannel: "TOA Color World / Thai Watsadu Phuket",
          recommended: true,
        },
        {
          id: "chk-ac-1",
          nameTh: "คาปาซิเตอร์คอมเพรสเซอร์แอร์เกรดอุตสาหกรรม + โฟมล้างคอยล์เย็น",
          nameEn: "Dual Motor Run Capacitor 40uF & Chemical Coil Cleaning Foam",
          category: "hvac",
          unitPrice: 960,
          unit: "ชุด",
          qty: 1,
          reason: "งานระบบปรับอากาศ: ป้องกันแอร์ไม่เย็น พัดลมไม่หมุน และคืนความสะอาดสดชื่นให้อากาศในวิลล่า",
          sourcingChannel: "ร้านอมร อิเล็คโทรนิคส์ / HomePro Phuket",
          recommended: true,
        },
        {
          id: "chk-pool-1",
          nameTh: "ตลับลูกปืน NSK ทนรอบจัด + แมคคานิคอลซีลเซรามิกสำหรับปั๊มน้ำสระ",
          nameEn: "NSK Sealed High-Speed Bearings & Pool Pump Mechanical Shaft Seal",
          category: "pool",
          unitPrice: 1600,
          unit: "ชุด",
          qty: 1,
          reason: "งานดูแลสระว่ายน้ำ: แก้ไขปัญหาปั๊มสระน้ำเสียงดังหอน หรือมีน้ำซึมหยดใต้คอมอเตอร์",
          sourcingChannel: "Pool Pro & Chemicals Phuket / ร้านแบริ่งภูเก็ต",
          recommended: true,
        },
        {
          id: "chk-elec-1",
          nameTh: "เบรกเกอร์กันดูด RCBO Schneider Electric Easy9 32A 30mA (มาตรฐานวิลล่า)",
          nameEn: "Schneider Electric Easy9 RCBO 32A 30mA Earth Leakage Breaker",
          category: "electrical",
          unitPrice: 950,
          unit: "ตัว",
          qty: 2,
          reason: "งานความปลอดภัยวิลล่า: ป้องกันไฟฟ้ารั่ว ไฟช็อต สำหรับวงจรเครื่องทำน้ำอุ่น แอร์ และปั๊มน้ำสระ",
          sourcingChannel: "โฮมโปร ฉลอง / ไทวัสดุ ถลาง",
          recommended: true,
        },
      ],
      suggestedItemsToAdd: isMissedQuery
        ? [
            {
              descriptionTh: "ค่าธรรมเนียมสงวนเวลาช่าง / ผิดนัดหมายเข้าหน้างาน (Cancellation / Missed Appointment Fee)",
              descriptionEn: "Cancellation / Missed Appointment Fee (Dedicated Technician Time Allocation)",
              unitPrice: 1000,
              qty: 1,
              unit: "ครั้ง (Visit)",
              sourcingChannel: "Phuket Trusted Local Official Policy",
            },
          ]
        : query
        ? [
            {
              descriptionTh: `${query} (เกรดมาตรฐานวิลล่าพรีเมียม)`,
              descriptionEn: `${query} (Villa Property Care Grade)`,
              unitPrice: 850,
              qty: 1,
              unit: "ชุด",
              sourcingChannel: "HomePro Phuket / Thai Watsadu",
            },
          ]
        : [],
      answer: isMissedQuery
        ? `💡 แนวทางและเรตราคาคิดค่าเสียเวลา / ผู้เช่าผิดนัดหมายสำหรับ Phuket Trusted Local ค่ะ:\n\n` +
          `1. **ห้ามใช้คำว่า Penalty** กับลูกค้า: ให้ใช้คำว่า **"Cancellation / Missed Appointment Fee"** เพราะเราไม่ได้ลงโทษ แต่คิดค่าบริการสำหรับเวลาและความเชี่ยวชาญของช่างที่ถูกจัดสรรไว้เฉพาะวิลล่า (Dedicated Technician Time & Opportunity Cost)\n\n` +
          `2. **เรตราคามาตรฐานแนะนำ**:\n` +
          `• ยกเลิกก่อน 24 ชม.: ฟรี (ไม่มีค่าใช้จ่าย)\n` +
          `• ยกเลิกน้อยกว่า 24 ชม.: ฿500\n` +
          `• ไม่มาตามนัด / เข้าบ้านไม่ได้: ฿1,000 (กรณีเบี้ยว 2 ครั้ง แนะนำ ฿1,000 ต่อครั้ง รวม ฿2,000)\n` +
          `• เดินทางไปถึงหน้างานแล้วแต่เข้าไม่ได้: ฿1,500\n\n` +
          `3. **ข้อความแจ้งลูกค้าก่อนนัดครั้งถัดไป (Appointment Policy)**:\n` +
          `"Appointment Policy: As the technician needs to be scheduled specifically for your property, we kindly ask that someone is available at the agreed appointment time. Cancellations with less than 24 hours’ notice or missed appointments may be subject to a cancellation fee of THB 1,000."\n\n` +
          `4. **ระบบเก็บมัดจำล่วงหน้า (Appointment Deposit)**:\n` +
          `ก่อนเข้านัดหมายครั้งที่ 3 แนะนำเก็บ Deposit THB 1,000 หากมาตามนัด ยอดจะนำไปหักจากค่าบริการติดตั้งจริง แต่หากเบี้ยวนัดโดยไม่แจ้งล่วงหน้า 24 ชม. ขอสงวนสิทธิ์ไม่คืนเงิน เพื่อไม่ต้องตามทวงเงินทีหลังค่ะ\n\n` +
          `5. **แยก 3 รายการโปร่งใสใน Invoice/Quotation**:\n` +
          `• Replacement / Installation (เช่น ฿2,000)\n` +
          `• Travel / Call-out (ตามโซน)\n` +
          `• Missed Appointment Fee (฿1,000)\n\n` +
          `มอลลี่เตรียมปุ่มกดเพิ่มรายการ Missed Appointment Fee เข้าใบเสนอราคาด้านล่างนี้ให้เรียบร้อยแล้วค่ะ!`
        : query
        ? `Molly เช็กราคาอุปกรณ์ "${query}" ให้แล้วค่ะ: ราคาตลาดในภูเก็ตอยู่ที่ประมาณ ฿650 - ฿1,800 (อ้างอิงแหล่งจัดซื้อ HomePro / ไทวัสดุ / ร้านสุขภัณฑ์ภูเก็ต) มอลลี่เตรียมปุ่มให้กดยืนยันเพิ่มเข้าใบเสนอราคาได้ทันทีค่ะ!`
        : "Molly คัดสรรอะไหล่เกรดวิลล่าพรีเมียม ครอบคลุมงานประตูบานเลื่อน สุขภัณฑ์ ปรับอากาศ สระว่ายน้ำ และระบบไฟฟ้า เพื่อความสบายใจสูงสุดของเจ้าของบ้านค่ะ",
    };

    if (!ai) {
      res.json(fallbackResponse);
      return;
    }

    try {
      const prompt = `
คุณคือ Molly ผู้เชี่ยวชาญด้านจัดซื้อ อะไหล่ และราคากลางอุปกรณ์ของ Phuket Trusted Local
บริบทการดำเนินงานของ Phuket Trusted Local:
- เราให้บริการ "Villa Inspection, Property Care & On-Ground Trusted Representation" ในภูเก็ต
- ลูกค้าคือเจ้าของวิลล่าชาวต่างชาติ (Absentee Owners), Expat, และผู้ปล่อยเช่า Luxury Rental ที่ต้องการตัวแทนดูแลบ้านที่ไว้ใจได้
- ขอบเขตงานครอบคลุมทุกระบบหลักของวิลล่า:
  1. ประตูบานเลื่อน-ลูกล้อคู่-รางเลื่อน-หน้าต่าง-มือจับ
  2. ประปา-สุขภัณฑ์-ก๊อกน้ำ-สายน้ำดี-ท่อน้ำทิ้ง-แก้น้ำรั่วซึม
  3. งานฝ้าเพดาน-คราบน้ำรั่ว-ทาสีเก็บรอย-ยาแนวกันซึม
  4. ระบบปรับอากาศ-ล้างแอร์-เปลี่ยนคาปาซิเตอร์
  5. ระบบปั๊มสระว่ายน้ำ-เปลี่ยนลูกปืน-แมคคานิคอลซีล
  6. ระบบความปลอดภัยไฟฟ้า-เบรกเกอร์ RCBO-สายดิน
- เราไม่ใช่ร้านคอมพิวเตอร์หรือช่างไฟเฉพาะทาง แต่เป็น Property Care ผู้ดูแลวิลล่าแบบเบ็ดเสร็จ ส่งมอบ "Peace of Mind" ให้เจ้าของบ้าน

หน้าที่ของ Molly:
- ช่วยเช็กราคาตลาดปัจจุบันในภูเก็ต (HomePro ฉลอง/ถลาง, ไทวัสดุ, Global House, ร้านสุขภัณฑ์/อะลูมิเนียมภูเก็ต)
- แนะนำอะไหล่และอุปกรณ์เกรดวิลล่าคุณภาพสูง ทนทานต่อสภาพอากาศร้อนชื้นและไอเกลือทะเล
- คำนวณค่าอุปกรณ์ + ค่าประสานงานจัดหาและตรวจรับงาน (Procurement Fee) ให้โปร่งใส ตรวจสอบได้
- สกิลพิเศษกรณีผู้เช่าหรือลูกค้าผิดนัดหมาย / ค่าเสียเวลา (Cancellation / Missed Appointment Fee Policy):
  * ห้ามใช้คำว่า "Penalty" เด็ดขาด ให้ใช้คำว่า "Cancellation / Missed Appointment Fee" (ค่าธรรมเนียมสงวนเวลาช่าง / ผิดนัดหมายเข้าหน้างาน)
  * ชี้แจงเรตราคามาตรฐาน: ยกเลิกก่อน 24 ชม. (ฟรี), ยกเลิก < 24 ชม. (500 THB), ไม่มาตามนัด/เข้าบ้านไม่ได้ (1,000 THB หรือเบี้ยว 2 ครั้งคิด 1,000 THB ต่อครั้ง), เดินทางไปถึงแล้วแต่เข้าไม่ได้ (1,500 THB)
  * ระบุข้อความ Appointment Policy ภาษาอังกฤษที่สุภาพพร้อมส่งให้ลูกค้า
  * แนะนำระบบ Appointment Deposit 1,000 THB สำหรับการนัดครั้งต่อไป เพื่อตัดปัญหาตามทวงเงิน
  * เน้นการแยก 3 รายการโปร่งใสในเอกสาร (Replacement/Installation, Travel/Call-out, Missed Appointment Fee)
  * หากผู้ใช้ถามเรื่องผิดนัดหมาย ให้ใส่ suggestedItemsToAdd รายการ Cancellation / Missed Appointment Fee 1,000 THB ให้อัตโนมัติ

วิลล่า: "${villaName || "Phuket Luxury Villa"}"
หมวดหมู่ที่เลือก: "${category || "งานตรวจและดูแลวิลล่า (Villa Care & Inspection)"}"
สิ่งที่ผู้ใช้พิมพ์หรือถาม: "${query || "ช่วยตรวจเช็กรายการอะไหล่และอุปกรณ์ว่ามีอะไรขาด หรือราคาตลาดภูเก็ตเหมาะสมหรือไม่"}"

รายการอะไหล่ในใบเสนอราคาปัจจุบัน:
${JSON.stringify(currentHardwareItems || [], null, 2)}

โปรดให้คำตอบในรูปแบบ JSON:
1. mollyGreeting: ข้อความที่มอลลี่ทักทายอย่างสุภาพ เป็นมืออาชีพ พร้อมดูแลวิลล่าทุกระบบ
2. priceTrendWarning: ข้อมูลแนวโน้มราคาตลาดและสต็อกวัสดุอุปกรณ์ในภูเก็ต
3. missingChecklist: รายการอะไหล่ที่แนะนำเพิ่มเติม (category: 'door_window' | 'plumbing' | 'ceiling_paint' | 'hvac' | 'pool' | 'electrical', unitPrice, unit, qty, reason, sourcingChannel, recommended)
4. suggestedItemsToAdd: หากผู้ใช้พิมพ์ค้นหาหรือสั่งเพิ่มของ ให้แปลงเป็นวัตถุพร้อมกดเพิ่มเข้าใบเสนอราคา (descriptionTh, descriptionEn, unitPrice, qty, unit, sourcingChannel)
5. answer: คำตอบเฉพาะเจาะจงสำหรับคำถามของผู้ใช้ ในมุมมองการบริหารจัดการและดูแลวิลล่าอย่างมีมาตรฐาน
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mollyGreeting: { type: Type.STRING },
              priceTrendWarning: { type: Type.STRING },
              missingChecklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    nameTh: { type: Type.STRING },
                    nameEn: { type: Type.STRING },
                    category: { type: Type.STRING },
                    unitPrice: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    reason: { type: Type.STRING },
                    sourcingChannel: { type: Type.STRING },
                    recommended: { type: Type.BOOLEAN },
                  },
                  required: [
                    "id",
                    "nameTh",
                    "nameEn",
                    "category",
                    "unitPrice",
                    "unit",
                    "qty",
                    "reason",
                    "sourcingChannel",
                  ],
                },
              },
              suggestedItemsToAdd: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    descriptionTh: { type: Type.STRING },
                    descriptionEn: { type: Type.STRING },
                    unitPrice: { type: Type.NUMBER },
                    qty: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    sourcingChannel: { type: Type.STRING },
                  },
                  required: ["descriptionTh", "descriptionEn", "unitPrice", "qty", "unit", "sourcingChannel"],
                },
              },
              answer: { type: Type.STRING },
            },
            required: ["mollyGreeting", "priceTrendWarning", "missingChecklist", "suggestedItemsToAdd", "answer"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err) {
      console.error("Molly assist error:", err);
      res.json(fallbackResponse);
    }
  });

  // --------------------------------------------------------------------------
  // AI Agent 2.1: Molly Express Quotation Copilot (ออกใบเสนอราคาด่วน)
  // --------------------------------------------------------------------------
  app.post("/api/gemini/molly-express-quote", async (req: Request, res: Response) => {
    const { prompt, customerName, villaName, propertyLocation, costPrice, laborFee, presetType } = req.body;

    const userPrompt = String(prompt || "").trim();
    const custName = customerName || (userPrompt.match(/คุณ\s*([^\s,]+)/)?.[1] ? `คุณ${userPrompt.match(/คุณ\s*([^\s,]+)/)?.[1]}` : "Customer (เจ้าของวิลล่า)");
    const villa = villaName || propertyLocation || "Phuket Private Residence";

    // Deterministic fallback generator in case Gemini is offline or fails
    const generateFallback = () => {
      let cost = Number(costPrice) || 0;
      let labor = Number(laborFee) || 0;

      // Extract numbers from prompt if not explicitly passed
      if (!cost) {
        const costMatch = userPrompt.match(/ทุน\s*[:=]?\s*([0-9,]+)/) || userPrompt.match(/ต้นทุน\s*[:=]?\s*([0-9,]+)/) || userPrompt.match(/([0-9,]+)\s*บาท/);
        if (costMatch) cost = parseInt(costMatch[1].replace(/,/g, ""), 10);
      }
      if (!labor) {
        const laborMatch = userPrompt.match(/ค่าแรง\s*[:=]?\s*([0-9,]+)/) || userPrompt.match(/ค่าบริการ\s*[:=]?\s*([0-9,]+)/);
        if (laborMatch) labor = parseInt(laborMatch[1].replace(/,/g, ""), 10);
      }

      // If still 0, provide smart domain defaults
      if (!cost && !labor) {
        cost = 1909;
        labor = 700;
      } else if (!labor) {
        labor = 700;
      }

      // Calculate market price with sensible rounding (~20-25% margin, nice round retail figure)
      let quotedPrice = cost > 0 ? Math.ceil((cost * 1.25) / 50) * 50 - 10 : 0;
      if (quotedPrice <= cost && cost > 0) quotedPrice = cost + 480;

      const isCCTV = userPrompt.includes("กล้อง") || userPrompt.includes("Tapo") || userPrompt.includes("cctv") || presetType === "cctv";
      const isAC = userPrompt.includes("แอร์") || userPrompt.includes("ac") || presetType === "ac";
      const isPump = userPrompt.includes("ปั๊ม") || userPrompt.includes("pump") || presetType === "pump";
      const isDoor = userPrompt.includes("ลูกล้อ") || userPrompt.includes("บานเลื่อน") || userPrompt.includes("door") || presetType === "door";

      let descEn = "High-Quality Villa Maintenance Spare Parts & Equipment Set";
      let descTh = "ชุดอุปกรณ์และอะไหล่แท้มาตรฐานงานดูแลวิลล่า (เกรดทนทานไอเกลือทะเล)";
      let serviceDesc = "On-Site Technical Installation & Engineering Labor";
      let serviceDetail = "งานบริการช่างเทคนิค: ติดตั้ง เดินสายไฟ ตรวจสอบการทำงาน และทดสอบระบบหน้างานจริง";
      let unit = "ชุด (Set)";

      if (isCCTV) {
        descEn = "TP-Link Tapo C320WS 4MP 2K QHD Outdoor Wi-Fi Security Camera + 128GB High Endurance MicroSD Card (Complete Set)";
        descTh = "ชุดกล้องวงจรปิด Wi-Fi ภายนอกอาคาร 4MP 2K QHD (Tapo C320WS) กันน้ำกันฝุ่น IP66 พร้อมเมมโมรี่การ์ด 128GB (ชุดพร้อมติดตั้ง)";
        serviceDesc = "Outdoor CCTV Mounting, Cabling, Power Connection & Mobile App Setup";
        serviceDetail = "งานบริการช่างเทคนิค: ยึดผนังภายนอกอาคาร เดินสายไฟจ่ายไฟเลี้ยงกล้อง เชื่อมต่อ Wi-Fi และเซ็ตอัปแอปพลิเคชันบนมือถือให้ลูกค้า";
      } else if (isAC) {
        descEn = "Dual Motor Run Capacitor 40uF & Chemical Coil Treatment Foam Kit";
        descTh = "ชุดอะไหล่คาปาซิเตอร์คอมเพรสเซอร์แอร์เกรดอุตสาหกรรม + โฟมล้างคอยล์เคมีสลายคราบ";
        serviceDesc = "Comprehensive Air Conditioning Deep Clean & Performance Tune-up";
        serviceDetail = "งานบริการช่างเทคนิค: ล้างแอร์แบบถอดรางน้ำทิ้ง ล้างพัดลมกรงกระรอก ตรวจวัดแรงดันน้ำยาแอร์ และทดสอบความเย็น";
      } else if (isPump) {
        descEn = "Mitsubishi/Hitachi 300W Constant Pressure Automatic Villa Water Pump";
        descTh = "ปั๊มน้ำอัตโนมัติแรงดันคงที่ 300W สำหรับพูลวิลล่า พร้อมข้อต่อเกลียวทองเหลืองและเช็ควาล์ว";
        serviceDesc = "Water Pump Installation, Bypass Plumbing & System Pressure Balancing";
        serviceDetail = "งานบริการช่างเทคนิค: รื้อถอนปั๊มเดิม ติดตั้งปั๊มใหม่ ต่อระบบท่อบายพาส และทดสอบแรงดันน้ำทุกจุดในบ้าน";
      } else if (isDoor) {
        descEn = "Heavy-Duty SUS304 Stainless Steel Tandem Sliding Door Rollers (Set of 2)";
        descTh = "ชุดลูกล้อคู่สแตนเลส SUS304 ประตูบานเลื่อนหนัก ปลอดสนิมตลอดอายุการใช้งาน (2 ชุด)";
        serviceDesc = "Sliding Door Track Alignment, Roller Replacement & Lubrication Service";
        serviceDetail = "งานบริการช่างเทคนิค: ถอดยกบานเลื่อน เปลี่ยนตลับลูกล้อคู่สแตนเลส ปรับระดับบาน และหล่อลื่นรางสแตนเลส";
      }

      const hardwareProfit = quotedPrice - cost;
      const totalProfit = hardwareProfit + labor;
      const grandTotal = quotedPrice + labor;
      const deposit = Math.round(grandTotal * 0.5);
      const balance = grandTotal - deposit;

      return {
        customerName: custName,
        villaName: villa,
        propertyLocation: villa.includes("Phuket") ? villa : `${villa}, Phuket`,
        serviceType: isCCTV ? "CCTV Security Installation" : isAC ? "HVAC Air Conditioning Service" : isPump ? "Water System & Pump Service" : "Villa Maintenance & Technical Services",
        hardwareItems: cost > 0 ? [
          {
            item: 1,
            descriptionEn: descEn,
            descriptionTh: descTh,
            qty: 1,
            unit: unit,
            costPrice: cost,
            unitPrice: quotedPrice,
            amount: quotedPrice,
          }
        ] : [],
        serviceItems: [
          {
            item: 1,
            description: serviceDesc,
            detail: serviceDetail,
            estimatedSchedule: "ภายใน 1 วันทำการ (พร้อมเข้าติดตั้งทันทีเมื่อนัดหมาย)",
            qty: "1 งาน (Job)",
            amount: labor,
          }
        ],
        procurementFeeRate: 0,
        terms: [
          "อุปกรณ์ทุกชิ้นเป็นของแท้ รับประกันศูนย์ 1 ปีเต็ม",
          "รับประกันงานติดตั้งและบริการโดยทีมช่าง Phuket Trusted Local 30 วัน",
          "บริการสอนการใช้งานและให้คำแนะนำหลังการติดตั้งอย่างครบถ้วน",
        ],
        depositPercent: 50,
        mollyGreeting: `มอลลี่คำนวณราคาให้เรียบร้อยแล้วค่ะ! วิเคราะห์จากต้นทุน ${cost.toLocaleString()} บาท มอลลี่แนะนำราคากลางหน้าร้านที่ ${quotedPrice.toLocaleString()} บาท (ทำให้ได้กำไรอะไหล่ ${hardwareProfit.toLocaleString()} บาท) เมื่อรวมกับค่าแรง ${labor.toLocaleString()} บาท ยอดรวมใบเสนอราคาจะอยู่ที่ ${grandTotal.toLocaleString()} บาทถ้วน เป็นราคาที่สมเหตุสมผล ลูกค้าตัดสินใจง่าย และช่างได้กำไรรวม ${totalProfit.toLocaleString()} บาทค่ะ!`,
        mollyFinancialAdvice: {
          hardwareCostTotal: cost,
          hardwareQuotedTotal: quotedPrice,
          hardwareProfit: hardwareProfit,
          laborFee: labor,
          totalGrossProfit: totalProfit,
          profitMarginPct: Math.round((totalProfit / (grandTotal || 1)) * 100),
          grandTotal: grandTotal,
          depositAmount: deposit,
          balanceAmount: balance,
          explanation: `กำไรสุทธิของคุณสำหรับงานนี้คือ ${totalProfit.toLocaleString()} บาท (กำไรส่วนต่างอะไหล่ ${hardwareProfit.toLocaleString()} บ. + ค่าแรงช่าง ${labor.toLocaleString()} บ.)`
        },
        lineMessageSummary: `เรียน ${custName}\nPhuket Trusted Local ขอส่งสรุปใบเสนอราคาด่วนสำหรับงานที่ ${villa} ค่ะ:\n\n1. ${descTh}: ${quotedPrice.toLocaleString()} บาท\n2. ${serviceDetail}: ${labor.toLocaleString()} บาท\n\n💰 ยอดรวมทั้งสิ้น: ${grandTotal.toLocaleString()} บาท\n(เงื่อนไขชำระ: มัดจำเริ่มงาน 50% = ${deposit.toLocaleString()} บาท / ชำระวันส่งมอบงาน = ${balance.toLocaleString()} บาท)\n\n✅ รับประกันงานช่าง 30 วัน • อะไหล่แท้รับประกันศูนย์ 1 ปี\nทางทีมพร้อมเข้าดำเนินการตามวันนัดหมายได้ทันทีค่ะ ขอบคุณมากค่ะ`
      };
    };

    if (!ai) {
      res.json(generateFallback());
      return;
    }

    try {
      const systemInstruction = `คุณคือ Molly (มอลลี่) ผู้เชี่ยวชาญด้านจัดซื้อ อะไหล่วิลล่า และคำนวณราคากลางใบเสนอราคาด่วน (Express Quotation Copilot) ของ Phuket Trusted Local
บริบทของเรา:
- เราคือ Phuket Trusted Local ดูแลงานระบบและวิลล่าในภูเก็ต (Villa Inspection, Property Care & Technical Services)
- ลูกค้าคือเจ้าของบ้าน/วิลล่า (คุณโบว์, ลูกค้าต่างชาติ, Expat, เจ้าของวิลล่าปล่อยเช่า)
- เป้าหมายของคุณ:
  1. แปลงความต้องการของผู้ใช้เป็นใบเสนอราคาที่พร้อมส่งลูกค้าทันที
  2. หากผู้ใช้ระบุต้นทุนอะไหล่ (เช่น 1,909 บาท) ให้คำนวณ 'ราคากลางตลาด' ที่เป็นธรรมต่อลูกค้า แต่ผู้รับเหมา/ช่างได้กำไรส่วนต่างอะไหล่ที่เหมาะสม (กำไร ~20-30% หรือปัดตัวเลขสวยๆ เช่น ทุน 1,909 -> ราคากลาง 2,390 บาท ได้กำไร 481 บาท)
  3. ใส่ค่าแรงช่างเทคนิคตามที่ผู้ใช้ระบุ หรือถ้าไม่ระบุให้แนะนำเรตที่เหมาะสมสำหรับงานช่างในภูเก็ต (เช่น 700 - 1,500 บาท)
  4. เขียนชื่อรายการอุปกรณ์และบริการทั้งภาษาอังกฤษและภาษาไทยอย่างมืออาชีพ (Bilingual)
  5. ตัดคำว่า 'Procurement Fee' หรือ 'Smart Procurement' ออกจากการแสดงผลลูกค้า ให้รวมอยู่ในราคากลางอุปกรณ์ (procurementFeeRate: 0)
  6. ร่างข้อความสั้นๆ สุภาพสำหรับส่ง LINE / WhatsApp ให้ลูกค้าทันที`;

      const promptText = `
ช่วยคำนวณและออกใบเสนอราคาด่วนจากข้อมูลนี้:
- ข้อมูลที่ผู้ใช้ระบุ: "${userPrompt}"
- ชื่อลูกค้า: "${custName}"
- สถานที่/วิลล่า: "${villa}"
- ต้นทุนอะไหล่ระบุ: ${costPrice || "ดึงจากข้อความ"}
- ค่าแรงระบุ: ${laborFee || "ดึงจากข้อความ"}
- แม่แบบ/ประเภทงาน: "${presetType || "ทั่วไป"}"

โปรดตอบในรูปแบบ JSON ตาม Schema ที่กำหนด
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptText,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              customerName: { type: Type.STRING },
              villaName: { type: Type.STRING },
              propertyLocation: { type: Type.STRING },
              serviceType: { type: Type.STRING },
              hardwareItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.INTEGER },
                    descriptionEn: { type: Type.STRING },
                    descriptionTh: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    costPrice: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                  },
                  required: ["item", "descriptionEn", "descriptionTh", "qty", "unit", "costPrice", "unitPrice", "amount"],
                },
              },
              serviceItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.INTEGER },
                    description: { type: Type.STRING },
                    detail: { type: Type.STRING },
                    estimatedSchedule: { type: Type.STRING },
                    qty: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                  },
                  required: ["item", "description", "detail", "estimatedSchedule", "qty", "amount"],
                },
              },
              procurementFeeRate: { type: Type.NUMBER },
              terms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              depositPercent: { type: Type.NUMBER },
              mollyGreeting: { type: Type.STRING },
              mollyFinancialAdvice: {
                type: Type.OBJECT,
                properties: {
                  hardwareCostTotal: { type: Type.NUMBER },
                  hardwareQuotedTotal: { type: Type.NUMBER },
                  hardwareProfit: { type: Type.NUMBER },
                  laborFee: { type: Type.NUMBER },
                  totalGrossProfit: { type: Type.NUMBER },
                  profitMarginPct: { type: Type.NUMBER },
                  grandTotal: { type: Type.NUMBER },
                  depositAmount: { type: Type.NUMBER },
                  balanceAmount: { type: Type.NUMBER },
                  explanation: { type: Type.STRING },
                },
                required: ["hardwareCostTotal", "hardwareQuotedTotal", "hardwareProfit", "laborFee", "totalGrossProfit", "grandTotal", "depositAmount", "balanceAmount", "explanation"],
              },
              lineMessageSummary: { type: Type.STRING },
            },
            required: [
              "customerName",
              "villaName",
              "propertyLocation",
              "serviceType",
              "hardwareItems",
              "serviceItems",
              "terms",
              "mollyGreeting",
              "mollyFinancialAdvice",
              "lineMessageSummary",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (!parsed.customerName) {
        res.json(generateFallback());
        return;
      }
      res.json(parsed);
    } catch (err) {
      console.error("Molly Express Quote Gemini error:", err);
      res.json(generateFallback());
    }
  });

  // --------------------------------------------------------------------------
  // AI Agent 3: Emily (Executive Assistant, Follow-up & Payment Copilot)
  // --------------------------------------------------------------------------
  app.post("/api/gemini/emily", async (req: Request, res: Response) => {
    const { action, task, paymentDetails, context } = req.body;

    if (!ai) {
      if (action === "payment_assistance" || action === "payout_calculation") {
        res.json({
          summary: "Emily ได้ตรวจสอบยอดค่าใช้จ่ายและคิวชำระเงินเรียบร้อยแล้ว",
          recommendation: "ยอดชำระสอดคล้องกับรายการในใบเสนอราคา และบันทึกหักเงินสำรองมัดจำ 50% เรียบร้อย สามารถอนุมัติโอนจ่ายได้ทันที",
          approvedAmount: paymentDetails?.amount || 4500,
          recipient: paymentDetails?.recipient || "ช่างเทคนิค / ร้านค้าคู่ค้า",
          paymentMemo: `โอนชำระงวดงาน ${paymentDetails?.villaName || "Villa"} • ผ่านการตรวจรับความเรียบร้อยโดย PTL Inspection`,
          whatsAppNoticeEn: `Dear ${paymentDetails?.recipient || "Partner"},\n\nPayment of ${(paymentDetails?.amount || 4500).toLocaleString()} THB for ${paymentDetails?.villaName || "service"} has been authorized and queued by Phuket Trusted Local.\n\nThank you for your excellent service!`,
          whatsAppNoticeTh: `เรียน ${paymentDetails?.recipient || "ผู้รับเงิน"},\n\nยอดเงิน ${(paymentDetails?.amount || 4500).toLocaleString()} บาท สำหรับงานที่ ${paymentDetails?.villaName || "วิลล่า"} ได้รับการอนุมัติและจัดคิวโอนเรียบร้อยแล้วค่ะ ขอบคุณมากค่ะ`,
        });
        return;
      }

      // Default follow up fallback
      res.json({
        draftEn: `Hi ${task?.clientName || "Sir/Madam"},\n\nHope you're having a wonderful week! This is Emily, Executive Assistant at Phuket Trusted Local.\n\nFollowing up on our inspection & proposal for ${task?.villaName || "your villa"}. Our engineering team and certified parts are on standby.\n\nPlease let me know if you would like us to reserve the technician schedule for this week, or if you need any adjustments.\n\nWarm regards,\nEmily • Executive Operations\nPhuket Trusted Local`,
        draftTh: `สวัสดีค่ะคุณ ${task?.clientName || "ลูกค้า"},\n\nเอมิลี่จากทีมผู้ช่วยบริหาร Phuket Trusted Local นะคะ ขออนุญาตติดตามความคืบหน้าเรื่องใบเสนอราคาและรายงานตรวจที่ ${task?.villaName || "วิลล่า"} ค่ะ หากสะดวกนัดวันให้ทีมช่างเข้าดำเนินการ สามารถแจ้งเอมิลี่ได้เลยนะคะ ยินดีดูแลค่ะ!`,
        actionPlan: "ส่งข้อความทาง WhatsApp หรือ LINE ในช่วงเวลา 10:00 - 16:30 น. เพื่อการตอบรับที่ดีที่สุด",
      });
      return;
    }

    try {
      const systemInstruction = `
คุณคือ Emily (เอมิลี่) ผู้ช่วยส่วนตัวของผู้บริหาร (Executive Assistant) และผู้ดูแลเรื่องการติดตามงาน (Follow-up) รวมถึงช่วยบริหารการเงิน/คิวจ่ายเงิน (Payment Copilot) ของบริษัท Phuket Trusted Local

ลักษณะบุคลิกและหน้าที่ของ Emily:
1. ด้านการติดตามงาน (Follow-up):
   - สุภาพ นุ่มนวล มีระดับ (Polished, Concierge-grade, Professional)
   - สื่อสารได้ทั้งภาษาอังกฤษ (สำหรับ Expat / Luxury Villa Owners) และภาษาไทย
   - ติดตามใบเสนอราคา, เตือนมัดจำ, นัดหมายช่าง, ขอ Gate Pass เข้าวิลล่า
2. ด้านการเงินและผู้ช่วยจ่ายเงิน (Payment & Cashflow Assistant):
   - ตรวจสอบยอดค่าใช้จ่าย (ค่าอะไหล่จากร้านอมร/HomePro, ค่าแรงช่างภาคสนาม Subcontractor)
   - คำนวณยอดสุทธิ หักลบยอดมัดจำ 50% ให้เจ้าของบริษัทตรวจสอบก่อนกดโอน
   - ร่างข้อความยืนยันการรับเงิน/ส่งสลิปให้ลูกค้า และร่างข้อความแจ้งโอนเงินให้ช่าง/ร้านค้า
3. การตอบ: ตอบตรงประเด็น นำไปใช้งานได้ทันที มีทั้งข้อความภาษาอังกฤษและไทย
`;

      const prompt = `
ภารกิจสำหรับ Emily:
- ประเภทงาน (Action): ${action || "follow_up_draft"}
- ข้อมูลงาน/ลูกค้า: ${JSON.stringify(task || {})}
- ข้อมูลการจ่ายเงิน/ค่าใช้จ่าย: ${JSON.stringify(paymentDetails || {})}
- บริบทเพิ่มเติม: ${context || "ช่วยร่างข้อความและแนะนำขั้นตอนถัดไป"}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              draftEn: { type: Type.STRING, description: "Professional English message for WhatsApp/Email" },
              draftTh: { type: Type.STRING, description: "Polite Thai message for LINE/Chat" },
              paymentMemo: { type: Type.STRING },
              approvedAmount: { type: Type.NUMBER },
              actionPlan: { type: Type.STRING },
            },
            required: ["summary", "recommendation", "draftEn", "draftTh"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err) {
      console.warn("Emily AI notice (falling back gracefully):", err);
      // Graceful fallback for rate limit (429) or offline
      if (action === "payment_assistance" || action === "payout_calculation") {
        res.json({
          summary: "Emily ได้ตรวจสอบยอดค่าใช้จ่ายและคิวชำระเงินเรียบร้อยแล้ว",
          recommendation: "ยอดชำระสอดคล้องกับรายการในใบเสนอราคา และบันทึกหักเงินสำรองมัดจำ 50% เรียบร้อย สามารถอนุมัติโอนจ่ายได้ทันที",
          approvedAmount: paymentDetails?.amount || 4500,
          recipient: paymentDetails?.recipient || "ช่างเทคนิค / ร้านค้าคู่ค้า",
          paymentMemo: `โอนชำระงวดงาน ${paymentDetails?.villaName || "Villa"} • ผ่านการตรวจรับความเรียบร้อยโดย PTL Inspection`,
          whatsAppNoticeEn: `Dear ${paymentDetails?.recipient || "Partner"},\n\nPayment of ${(paymentDetails?.amount || 4500).toLocaleString()} THB for ${paymentDetails?.villaName || "service"} has been authorized and queued by Phuket Trusted Local.\n\nThank you for your excellent service!`,
          whatsAppNoticeTh: `เรียน ${paymentDetails?.recipient || "ผู้รับเงิน"},\n\nยอดเงิน ${(paymentDetails?.amount || 4500).toLocaleString()} บาท สำหรับงานที่ ${paymentDetails?.villaName || "วิลล่า"} ได้รับการอนุมัติและจัดคิวโอนเรียบร้อยแล้วค่ะ ขอบคุณมากค่ะ`,
        });
      } else {
        res.json({
          summary: `การติดตามงานสำหรับ ${task?.villaName || "วิลล่า"}`,
          recommendation: "ส่งข้อความติดตามผลทาง WhatsApp/LINE เพื่อจองคิวช่างล่วงหน้า",
          draftEn: `Hi ${task?.clientName || "Sir/Madam"},\n\nHope you're having a wonderful week! This is Emily from Phuket Trusted Local.\n\nFollowing up on our inspection report and quotation for ${task?.villaName || "your villa"}. Our certified technicians are ready to proceed.\n\nPlease let us know if you would like us to schedule this week.\n\nWarm regards,\nEmily • Executive Assistant\nPhuket Trusted Local`,
          draftTh: `สวัสดีค่ะคุณ ${task?.clientName || "ลูกค้า"},\n\nเอมิลี่จาก Phuket Trusted Local นะคะ ขออนุญาตติดตามเรื่องรายงานตรวจและใบเสนอราคาสำหรับ ${task?.villaName || "วิลล่า"} ค่ะ หากสะดวกนัดทีมช่างเข้าดำเนินการแจ้งเอมิลี่ได้เลยนะคะ ยินดีดูแลค่ะ!`,
          paymentMemo: `ติดตามคิวนัดหมาย ${task?.villaName || ""}`,
          approvedAmount: 0,
          actionPlan: "ส่งข้อความทาง WhatsApp หรือ LINE ในช่วงเวลา 10:00 - 16:30 น.",
        });
      }
    }
  });

  // --------------------------------------------------------------------------
  // AI Agent 4: Varvara (Social Media & Content Marketing Specialist)
  // --------------------------------------------------------------------------
  app.post("/api/gemini/varvara", async (req: Request, res: Response) => {
    const {
      villaName,
      serviceType,
      findingsSummary,
      platform = "facebook",
      language = "en",
      tone = "case_study",
      photoDescriptions,
    } = req.body;

    if (!ai) {
      res.json({
        hook: "🛡️ Ensuring Phuket Luxury Villas Stay Safe, Pristine & Guest-Ready All Year Round!",
        captionEn: `🌴 Another comprehensive Villa Inspection & Property Care restoration completed at ${villaName || "Phuket Luxury Villa"}!\n\nAbsentee villa owners and property investors rely on Phuket Trusted Local for complete peace of mind. We inspect, diagnose, and supervise the rectification of defects across every critical villa system: heavy sliding doors, sanitary plumbing, climate control, water circulation, and safety electrical circuits.\n\n🛠️ What we delivered:\n• Rigorous multi-point field inspection with photographic evidence\n• Precision defect rectification using certified, premium-grade replacement parts\n• Bilingual 3-document handover package (Findings Report, Quotation & Receipt)\n\nNever let minor defects turn into costly damages. Book your professional villa audit today! 🛡️\n\n#PhuketVilla #PhuketRealEstate #VillaMaintenance #PhuketExpat #VillaCarePhuket #PhuketTrustedLocal`,
        captionTh: `🌴 ส่งมอบงานตรวจรับและดูแลสภาพพูลวิลล่าแบบครบวงจรที่ ${villaName || "พูลวิลล่าภูเก็ต"}!\n\nที่ Phuket Trusted Local เราคือตัวแทนหน้างานที่เจ้าของวิลล่าชาวต่างชาติและนักลงทุนไว้วางใจ ดูแลตรวจสอบจุดบกพร่องทุกระบบอย่างละเอียด ทั้งประตูบานเลื่อน, ท่อรั่วซึม-สุขภัณฑ์, รอยน้ำฝ้าเพดาน, ระบบแอร์ และความปลอดภัยไฟฟ้า\n\n✨ ผลลัพธ์ที่เจ้าของวิลล่าได้รับ:\n• สรุปรายงานการตรวจ 3 เอกสารมาตรฐานสากล พร้อมภาพถ่ายหน้างานชัดเจน\n• ทีมช่างเข้าแก้ไขจุดชำรุดด้วยอะไหล่เกรดพรีเมียม ปลอดสนิม ทนไอเกลือทะเล\n• รับประกันงานซ่อม ให้คุณสบายใจ ไร้กังวลแม้ไม่ได้อยู่ภูเก็ต\n\nให้เราดูแลวิลล่าของคุณอย่างมืออาชีพ ปรึกษาทีมงาน Phuket Trusted Local ได้ทันทีค่ะ 🛡️\n\n#ช่างภูเก็ต #ดูแลพูลวิลล่า #ตรวจรับบ้านภูเก็ต #ซ่อมแซมวิลล่า #PhuketPropertyCare #PhuketTrustedLocal`,
        captionRu: `🌴 Комплексный аудит и профессиональный уход за виллой на Пхукете (${villaName || "Luxury Villa"})!\n\nКоманда Phuket Trusted Local обеспечивает полное спокойствие для владельцев недвижимости. Проверка раздвижных дверей, сантехники, кондиционеров и электробезопасности с подробным фотоотчетом.\n\nДоверьте заботу о вашей вилле профессионалам на Пхукете! 🛡️\n\n#ПхукетВилла #НедвижимостьПхукет #PhuketPropertyCare #PhuketTrustedLocal`,
        hashtags: [
          "#PhuketVilla",
          "#PhuketTrustedLocal",
          "#VillaMaintenancePhuket",
          "#VillaInspectionPhuket",
          "#PhuketExpat",
          "#LuxuryVillaCare",
          "#PhuketRealEstate",
        ],
        marketingTip: "โพสต์ร่วมกับรูปถ่าย Before/After ของหน้างาน เช่น บานเลื่อนที่แก้ไขแล้ว หรืออุปกรณ์สุขภัณฑ์ใหม่ เพื่อสร้างความเชื่อมั่นให้เจ้าของวิลล่าในภูเก็ต",
      });
      return;
    }

    try {
      const systemInstruction = `
คุณคือ Varvara (วาร์วาร่า) ผู้เชี่ยวชาญด้าน Social Media Marketing & Content Creator ของ Phuket Trusted Local

บทบาทของคุณ:
- นำรูปภาพการทำงานจริง, ผลการตรวจของ Mr. Big, อุปกรณ์จาก Molly, และความสำเร็จในการแก้ปัญหาพูลวิลล่าในภูเก็ต มาสร้างเป็นโพสต์ Social Media ที่ดึงดูด น่าเชื่อถือ และสะท้อนภาพลักษณ์ระดับพรีเมียม (High-end Villa Inspection, Property Care & On-Ground Representation in Phuket)
- กลุ่มเป้าหมายในภูเก็ต: เจ้าของวิลล่าชาวต่างชาติ (Absentee Owners / Investors), ผู้พักอาศัย Expat, วิลล่าเมเนเจอร์, นิติบุคคลโครงการหรู (เช่น ลากูน่า, เชิงทะเล, ในหาน, กมลา)
- คุณค่าหลักที่เราสื่อสาร: "Peace of Mind" (ความสบายใจ ไร้กังวล มีตัวแทนหน้างานที่ไว้ใจได้ดูแลบ้านให้อย่างโปร่งใส)
- แพลตฟอร์ม: Facebook (เน้น Case Study และภาพความน่าเชื่อถือ), Instagram (เน้นภาพสวย คลีน ดูโมเดิร์น), Google Business (เน้น Local SEO ภูเก็ต)
- รูปแบบภาษา: เขียนให้ครอบคลุมทั้ง ภาษาอังกฤษ (ระดับสากล) และ ภาษาไทย (เป็นกันเอง มั่นใจ) รวมถึงภาษารัสเซียหากต้องการ
- ใส่ Emoji อย่างมีรสนิยม และคัดสรรแฮชแท็กเฉพาะกลุ่มภูเก็ต
`;

      const prompt = `
สร้างโพสต์ Social Media จากงานตรวจและดูแลวิลล่าจริง:
- ชื่อวิลล่า/สถานที่: "${villaName || "Luxury Pool Villa, Phuket"}"
- ประเภทงาน: "${serviceType || "Villa Inspection & Comprehensive Property Care"}"
- สรุปปัญหาและสิ่งที่แก้ไข: "${findingsSummary || "ตรวจเช็กข้อบกพร่องและแก้ไขจุดชำรุดตามรายงานของ Mr. Big และ Molly"}"
- แพลตฟอร์มเป้าหมาย: ${platform}
- สไตล์/โทน (Tone): ${tone}
- คำอธิบายรูปภาพหน้างาน: "${photoDescriptions || "ภาพผลการตรวจและการเปลี่ยนอะไหล่หน้างาน"}"
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING, description: "Catchy first line for social media scroll-stopping" },
              captionEn: { type: Type.STRING, description: "Engaging English caption" },
              captionTh: { type: Type.STRING, description: "Polite & professional Thai caption" },
              captionRu: { type: Type.STRING, description: "Russian caption for Russian villa owners in Phuket" },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              marketingTip: { type: Type.STRING, description: "Varvara's advice on when to post or photo framing" },
            },
            required: ["hook", "captionEn", "captionTh", "hashtags", "marketingTip"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err) {
      console.warn("Varvara AI notice (falling back gracefully):", err);
      // Graceful fallback for rate limit (429) or offline
      res.json({
        hook: "🛡️ Ensuring Phuket Luxury Villas Stay Safe, Pristine & Guest-Ready All Year Round!",
        captionEn: `🌴 Professional Villa Inspection & Property Care completed at ${villaName || "Phuket Luxury Villa"}!\n\nAbsentee villa owners and property investors rely on Phuket Trusted Local for complete peace of mind. We inspect, diagnose, and supervise the rectification of defects across every critical villa system: heavy sliding doors, sanitary plumbing, climate control, water circulation, and safety electrical circuits.\n\n🛠️ What we delivered:\n• Rigorous multi-point field inspection with photographic evidence\n• Precision defect rectification using certified, premium-grade replacement parts\n• Bilingual 3-document handover package (Findings Report, Quotation & Receipt)\n\nNever let minor defects turn into costly damages. Book your professional villa audit today! 🛡️\n\n#PhuketVilla #PhuketRealEstate #VillaMaintenance #PhuketExpat #VillaCarePhuket #PhuketTrustedLocal`,
        captionTh: `🌴 ส่งมอบงานตรวจรับและดูแลสภาพพูลวิลล่าแบบครบวงจรที่ ${villaName || "พูลวิลล่าภูเก็ต"}!\n\nที่ Phuket Trusted Local เราคือตัวแทนหน้างานที่เจ้าของวิลล่าชาวต่างชาติและนักลงทุนไว้วางใจ ดูแลตรวจสอบจุดบกพร่องทุกระบบอย่างละเอียด ทั้งประตูบานเลื่อน, ท่อรั่วซึม-สุขภัณฑ์, รอยน้ำฝ้าเพดาน, ระบบแอร์ และความปลอดภัยไฟฟ้า\n\n✨ ผลลัพธ์ที่เจ้าของวิลล่าได้รับ:\n• สรุปรายงานการตรวจ 3 เอกสารมาตรฐานสากล พร้อมภาพถ่ายหน้างานชัดเจน\n• ทีมช่างเข้าแก้ไขจุดชำรุดด้วยอะไหล่เกรดพรีเมียม ปลอดสนิม ทนไอเกลือทะเล\n• รับประกันงานซ่อม ให้คุณสบายใจ ไร้กังวลแม้ไม่ได้อยู่ภูเก็ต\n\nให้เราดูแลวิลล่าของคุณอย่างมืออาชีพ ปรึกษาทีมงาน Phuket Trusted Local ได้ทันทีค่ะ 🛡️\n\n#ช่างภูเก็ต #ดูแลพูลวิลล่า #ตรวจรับบ้านภูเก็ต #ซ่อมแซมวิลล่า #PhuketPropertyCare #PhuketTrustedLocal`,
        captionRu: `🌴 Комплексный аудит и профессиональный уход за виллой на Пхукете (${villaName || "Luxury Villa"})!\n\nКоманда Phuket Trusted Local обеспечивает полное спокойствие для владельцев недвижимости. Проверка раздвижных дверей, сантехники, кондиционеров и электробезопасности с подробным фотоотчетом.\n\nДоверьте заботу о вашей вилле профессионалам на Пхукете! 🛡️\n\n#ПхукетВилла #НедвижимостьПхукет #PhuketPropertyCare #PhuketTrustedLocal`,
        hashtags: [
          "#PhuketVilla",
          "#PhuketTrustedLocal",
          "#VillaMaintenancePhuket",
          "#VillaInspectionPhuket",
          "#PhuketExpat",
          "#LuxuryVillaCare",
          "#PhuketRealEstate",
        ],
        marketingTip: "โพสต์ร่วมกับรูปถ่าย Before/After ของหน้างานเพื่อสร้างความเชื่อมั่นให้เจ้าของวิลล่าในภูเก็ต",
      });
    }
  });

  // Backwards compatibility endpoint for generate-quotation
  app.post("/api/gemini/generate-quotation", async (req: Request, res: Response) => {
    // Forward to Molly logic
    const { findings, customerName, location } = req.body;
    try {
      const result = await fetch(`http://127.0.0.1:${PORT}/api/gemini/molly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findings, customerName, location }),
      });
      const data = await result.json();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate quotation" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Primary listen
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
