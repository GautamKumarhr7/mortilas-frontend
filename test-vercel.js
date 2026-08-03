import axios from 'axios';
async function test() {
  try {
    const res = await axios.post('https://mortilas.vercel.app/api/auth/login', { email: "admin@gmail.com", password: "password" });
    const token = res.data.data.accessToken;
    console.log("Got token");
    try {
      const vRes = await axios.get('https://mortilas.vercel.app/api/vendors', { headers: { Authorization: `Bearer ${token}` } });
      console.log(vRes.status);
    } catch(err) {
      console.error("Vendor fetch failed:", err.response?.status, err.response?.data);
    }
  } catch(e) { console.error("Login failed:", e.message); }
}
test();
