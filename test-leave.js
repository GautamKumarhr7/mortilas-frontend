import fetch from "node-fetch";

async function run() {
  const payload = {
    employeeId: 3,
    type: "CL",
    title: "Test Leave",
    description: "Testing",
    fromDate: "2026-07-20",
    toDate: "2026-07-20"
  };
  
  const res = await fetch("http://localhost:8000/leave-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  console.log(await res.text());
  
  const bal = await fetch("http://localhost:8000/leaves/user/3");
  console.log(await bal.text());
}
run();
