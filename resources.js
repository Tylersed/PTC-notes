/* ═══════════════════════════════════════════════════════════════
   Peachtree Town & Country — Advisor Resource Center
   RESOURCES DATA FILE
   ───────────────────────────────────────────────────────────────
   This is the ONLY file that needs to be updated when adding,
   editing, or removing resources from the Resource Center.
 
   After exporting from the Admin Panel, upload ONLY this file
   to GitHub — index.html never needs to change.
 
   Structure guide:
   ─────────────────
   Main card (direct link):       { label, desc, icon, type, url, isNew, section }
   Main card (with folders):      { label, desc, icon, type, isNew, section, children: [...] }
   Folder with files:             { label, desc, icon, type, children: [...] }
   Folder direct link:            { label, desc, icon, type, url }
   Individual file:               { label, desc, icon, type, url }
═══════════════════════════════════════════════════════════════ */
 
/* Site-wide config (announcement banner etc.) */
let SITE_CONFIG = {
  "announcementActive": false,
  "announcementText": ""
};
 
let RESOURCES = [
  {
    "label": "Brand Collateral",
    "desc": "Logos, approved files, and branded collateral assets",
    "icon": "🎨",
    "type": "Folder",
    "url": "https://drive.google.com/drive/folders/1RI0gxifMwDRnykzTXQ5zzMwOq8nSGV8n?usp=drive_link",
    "children": [
      {
        "label": "Buyers Guide",
        "desc": "Buyer presentation guides for client meetings",
        "icon": "📘",
        "type": "Guide",
        "children": [
          {
            "label": "Buyers Guide — Version 1",
            "desc": "",
            "icon": "📄",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1zdIYSU2F79WhXbkRr-cQUhr1ZFJnDcDU/view?usp=sharing"
          },
          {
            "label": "Buyers Guide — Version 2",
            "desc": "",
            "icon": "📄",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1aWjPfY6_KDKMBYCDtz99GscFn7C0aVHD/view?usp=drive_link"
          }
        ]
      },
      {
        "label": "Listing Presentation",
        "desc": "Seller listing presentation deck",
        "icon": "🏡",
        "type": "Folder",
        "url": "https://drive.google.com/drive/folders/11awYcq7b84-F6sbeWuL0F9s9OO6BbXLG?usp=drive_link",
        "children": [
          {
            "label": "Listing Presentation — Version 1",
            "desc": "",
            "icon": "📄",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1Ccj7w__LksTiUxRJRwrkdEpaOvcMAPJM/view?usp=drive_link"
          },
          {
            "label": "Listing Presentation — Version 2",
            "desc": "",
            "icon": "📄",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1pznWuxPgLkEyHuAgPpq4WNIgTYcrXxtE/view?usp=drive_link"
          }
        ]
      },
      {
        "label": "Sellers Guide",
        "desc": "Seller guide for client presentations",
        "icon": "📗",
        "type": "Folder",
        "url": "https://drive.google.com/drive/folders/1l16ruESyBbrLBSo_mFAJT574eFT8Y36e?usp=drive_link",
        "children": [
          {
            "label": "Sellers Guide — Version 1",
            "desc": "",
            "icon": "📄",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1FQKxuxBMTSy-gixd6vXSE3qtN-SFSvik/view?usp=drive_link"
          },
          {
            "label": "Sellers Guide — Version 2",
            "desc": "",
            "icon": "📄",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1oPkFlHCz8QhgfF_WJUi1DicmOM_uQe0e/view?usp=drive_link"
          }
        ]
      }
    ]
  },
  {
    "label": "Branding Compliance Library",
    "desc": "Brand standards, usage rules, and compliance guidelines",
    "icon": "📋",
    "type": "Guide",
    "url": "PASTE_LINK_HERE"
  },
  {
    "label": "Desktop Wallpaper",
    "desc": "Official branded desktop and device wallpapers",
    "icon": "🖥️",
    "type": "Assets",
    "url": "PASTE_LINK_HERE"
  },
  {
    "label": "Disclaimers",
    "desc": "Legal disclaimers, disclosures, and required language",
    "icon": "⚖️",
    "type": "Doc",
    "url": "PASTE_LINK_HERE"
  },
  {
    "label": "FMLS & OneHome",
    "desc": "MLS resources, OneHome portal guides, and listing tools",
    "icon": "🏠",
    "type": "Guide",
    "url": "PASTE_LINK_HERE"
  },
  {
    "label": "Photography & Video",
    "desc": "Standards, vendor contacts, and submission guidelines",
    "icon": "📸",
    "type": "Guide",
    "url": "PASTE_LINK_HERE"
  },
  {
    "label": "Social Media Assets",
    "desc": "Templates, graphics, and approved social content",
    "icon": "📱",
    "type": "Assets",
    "url": "PASTE_LINK_HERE"
  },
  {
    "label": "Training & How-To Videos",
    "desc": "Step-by-step training videos and onboarding resources",
    "icon": "🎓",
    "type": "Video",
    "url": "PASTE_LINK_HERE"
  },
  {
    "label": "Virtual Staging",
    "desc": "Vendors, examples, and the submission process",
    "icon": "🛋️",
    "type": "Guide",
    "url": "PASTE_LINK_HERE"
  },
  {
    "icon": "⭐",
    "label": "Best Practices",
    "desc": "Company-wide best practices and advisor playbooks",
    "type": "Guide",
    "isNew": false,
    "section": "",
    "children": [
      {
        "icon": "📁",
        "label": "Marketing Best Practices",
        "desc": "",
        "type": "Folder",
        "children": [
          {
            "icon": "📄",
            "label": "Google My Business Best Practices for Realtors",
            "desc": "",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1xSBT8Dw4vnWhUo6LsOn7vdcwyvJnLGEZ/view?usp=drive_link"
          },
          {
            "icon": "📄",
            "label": "arketing Department Best Practices 2026",
            "desc": "",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1iPSHXtGkTgJisFlpWETeQ4orlL4EFnbo/view?usp=drive_link"
          }
        ]
      },
      {
        "icon": "📁",
        "label": "Contracts Best Practices",
        "desc": "",
        "type": "Folder",
        "children": [
          {
            "icon": "📄",
            "label": "How To Sign the Contract",
            "desc": "",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1K_uk05aRrcyyssf9ILkGX_IeQO_8Ir3R/view?usp=drive_link"
          },
          {
            "icon": "📄",
            "label": "Hierarchy Rules from Top to Bottom",
            "desc": "",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1-LNrW-0OCS2rlZjQ_nQt5ltLntR9_chD/view?usp=drive_link"
          },
          {
            "icon": "📄",
            "label": "Contracts Best Practices",
            "desc": "",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1-HyvtDK3cHCgD4mvj69JYTk-A0YRLPyh/view?usp=drive_link"
          }
        ]
      },
      {
        "icon": "📁",
        "label": "Buyer Best Practices",
        "desc": "",
        "type": "Folder",
        "children": [
          {
            "icon": "📄",
            "label": "How to Sign the Contract",
            "desc": "",
            "type": "PDF",
            "url": "https://drive.google.com/file/d/1qq7_AdJ31CYAorXuCJ_04un4PmcSZikG/view?usp=drive_link"
          },
          {
            "icon": "📄",
            "label": "",
            "desc": "",
            "type": "PDF",
            "url": "PASTE_LINK_HERE"
          }
        ]
      }
    ]
  }
];
