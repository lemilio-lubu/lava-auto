const fs = require('fs');
const path = './src/app/dashboard/admin/lavadores/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file got messed up before with `import Modal from "@/components/ui/Modal";\nimport AdminForm from "@/components/admin/AdminForm";;`
// We need to clean it up and restore the proper state.

// 1. Let's start over by reloading the history if available or just clean the top manually.
content = content.replace(/import Modal.*/, 'import Modal from "@/components/ui/Modal";\nimport WasherForm from "@/components/washer/WasherForm";\nimport AdminForm from "@/components/admin/AdminForm";');
content = content.replace(/import AdminForm.*/g, ""); // clean old duplicates
content = content.replace('import Modal from "@/components/ui/Modal";', 'import Modal from "@/components/ui/Modal";\nimport AdminForm from "@/components/admin/AdminForm";');


fs.writeFileSync(path, content);
