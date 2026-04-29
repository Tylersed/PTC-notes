/* ═══════════════════════════════════════════════════════════════
   Peachtree Town & Country — Advisor Resource Center
   RESOURCES DATA FILE
   ───────────────────────────────────────────────────────────────
   This is the ONLY file that needs to be updated when adding,
   editing, or removing tiles from the Resource Center.

   After exporting from the Admin Panel, upload ONLY this file
   to GitHub — index.html never needs to change.

   Structure guide:
   ─────────────────
   Top-level tile with a direct link (no sub-folders):
     { label, desc, icon, type, url }

   Top-level tile with sub-folders:
     { label, desc, icon, type, children: [ ...subfolders ] }

   Sub-folder with individual files inside:
     { label, desc, icon, type, children: [ ...files ] }

   Sub-folder with a single direct link (no individual files):
     { label, desc, icon, type, url }

   Individual file:
     { label, desc, icon, type, url }
═══════════════════════════════════════════════════════════════ */

/* Site-wide config — managed via Admin Panel */
let SITE_CONFIG = {
  announcementActive: false,
  announcementText: ''
};

let RESOURCES = [
  {
    label: "Brand Collateral",
    desc:  "Logos, approved files, and branded collateral assets",
    icon:  "🎨",
    type:  "Folder",
    url:   "https://drive.google.com/drive/folders/1RI0gxifMwDRnykzTXQ5zzMwOq8nSGV8n?usp=drive_link",
    children: [
      {
        label: "Buyers Guide",
        desc:  "Buyer presentation guides for client meetings",
        icon:  "📘",
        type:  "Guide",
        children: [
          {
            label: "Buyers Guide — Version 1",
            desc:  "",
            icon:  "📄",
            type:  "PDF",
            url:   "https://drive.google.com/file/d/1zdIYSU2F79WhXbkRr-cQUhr1ZFJnDcDU/view?usp=sharing"
          },
          {
            label: "Buyers Guide — Version 2",
            desc:  "",
            icon:  "📄",
            type:  "PDF",
            url:   "https://drive.google.com/file/d/1aWjPfY6_KDKMBYCDtz99GscFn7C0aVHD/view?usp=drive_link"
          }
        ]
      },
      {
        label: "Listing Presentation",
        desc:  "Seller listing presentation deck",
        icon:  "🏡",
        type:  "Folder",
        url:   "https://drive.google.com/drive/folders/11awYcq7b84-F6sbeWuL0F9s9OO6BbXLG?usp=drive_link",
        children: [
          {
            label: "Listing Presentation — Version 1",
            desc:  "",
            icon:  "📄",
            type:  "PDF",
            url:   "https://drive.google.com/file/d/1Ccj7w__LksTiUxRJRwrkdEpaOvcMAPJM/view?usp=drive_link"
          },
          {
            label: "Listing Presentation — Version 2",
            desc:  "",
            icon:  "📄",
            type:  "PDF",
            url:   "https://drive.google.com/file/d/1pznWuxPgLkEyHuAgPpq4WNIgTYcrXxtE/view?usp=drive_link"
          }
        ]
      },
      {
        label: "Sellers Guide",
        desc:  "Seller guide for client presentations",
        icon:  "📗",
        type:  "Folder",
        url:   "https://drive.google.com/drive/folders/1l16ruESyBbrLBSo_mFAJT574eFT8Y36e?usp=drive_link",
        children: [
          {
            label: "Sellers Guide — Version 1",
            desc:  "",
            icon:  "📄",
            type:  "PDF",
            url:   "https://drive.google.com/file/d/1FQKxuxBMTSy-gixd6vXSE3qtN-SFSvik/view?usp=drive_link"
          },
          {
            label: "Sellers Guide — Version 2",
            desc:  "",
            icon:  "📄",
            type:  "PDF",
            url:   "https://drive.google.com/file/d/1oPkFlHCz8QhgfF_WJUi1DicmOM_uQe0e/view?usp=drive_link"
          }
        ]
      }
    ]
  },
  {
    label: "Branding Compliance Library",
    desc:  "Brand standards, usage rules, and compliance guidelines",
    icon:  "📋",
    type:  "Guide",
    url:   "PASTE_LINK_HERE"
  },
  {
    label: "Desktop Wallpaper",
    desc:  "Official branded desktop and device wallpapers",
    icon:  "🖥️",
    type:  "Assets",
    url:   "PASTE_LINK_HERE"
  },
  {
    label: "Disclaimers",
    desc:  "Legal disclaimers, disclosures, and required language",
    icon:  "⚖️",
    type:  "Doc",
    url:   "PASTE_LINK_HERE"
  },
  {
    label: "FMLS & OneHome",
    desc:  "MLS resources, OneHome portal guides, and listing tools",
    icon:  "🏠",
    type:  "Guide",
    url:   "PASTE_LINK_HERE"
  },
  {
    label: "Photography & Video",
    desc:  "Standards, vendor contacts, and submission guidelines",
    icon:  "📸",
    type:  "Guide",
    url:   "PASTE_LINK_HERE"
  },
  {
    label: "Social Media Assets",
    desc:  "Templates, graphics, and approved social content",
    icon:  "📱",
    type:  "Assets",
    url:   "PASTE_LINK_HERE"
  },
  {
    label: "Training & How-To Videos",
    desc:  "Step-by-step training videos and onboarding resources",
    icon:  "🎓",
    type:  "Video",
    url:   "PASTE_LINK_HERE"
  },
  {
    label: "Virtual Staging",
    desc:  "Vendors, examples, and the submission process",
    icon:  "🛋️",
    type:  "Guide",
    url:   "PASTE_LINK_HERE"
  },
  {
    label: "Best Practices",
    desc:  "Company-wide best practices and advisor playbooks",
    icon:  "⭐",
    type:  "Guide",
    url:   "PASTE_LINK_HERE"
  }
];
