import React, { useState } from 'react';
import { User, Lock, ArrowRight, HelpCircle, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Post } from '@services/https';
import Input from '@components/ui/Input';
import Label from '@components/ui/Label';
import Button from '@components/ui/Button';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      addToast('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await Post('/auth/login', {
        username: formData.username,
        password: formData.password
      });

      const { token, user } = response.data;

      // บันทึกข้อมูลผ่าน AuthContext
      login(token, user.role, user);

      addToast('เข้าสู่ระบบสำเร็จ', 'success');

      // นำทางไปยังหน้าหลัก (Routing จะเปลี่ยนตาม Role อัตโนมัติเพราะใช้ AuthContext)
      navigate('/');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'การเข้าสู่ระบบล้มเหลว';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf6] relative overflow-hidden font-['Noto_Sans_Thai']">
      {/* Background Texture/Gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#003527_0.5px,transparent_0.5px)] [background-size:20px_20px]"></div>
      
      <div className="flex-grow flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Main Login Card */}
          <div className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(30,41,59,0.05)] overflow-hidden">
            <div className="p-8">
              {/* Logo Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center mb-4 shadow-md">
                  <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-2xl font-bold text-[#003527] mb-1">ระบบจัดการสุสาน</h1>
                <p className="text-sm text-[#707974]">การจัดการที่ให้เกียรติและมั่นคง</p>
              </div>

              {/* Form Section */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="username">ชื่อผู้ใช้งาน</Label>
                  <Input
                    id="username"
                    icon={User}
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="mb-0">รหัสผ่าน</Label>
                    {/* <a href="#" className="text-xs font-medium text-[#003527] hover:underline">ลืมรหัสผ่าน?</a> */}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    icon={Lock}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-[#bfc9c3] text-[#003527] focus:ring-[#003527] cursor-pointer"
                    checked={formData.remember}
                    onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-[#404944] cursor-pointer">จดจำฉันในระบบ</label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-2" 
                  icon={ArrowRight}
                  disabled={loading}
                >
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </Button>
              </form>
            </div>

            {/* Helper Link */}
            {/* <div className="bg-[#f2f4f1] py-4 px-8 text-center text-xs text-[#707974]">
              ต้องการความช่วยเหลือ? <a href="#" className="font-bold text-[#003527] hover:underline">ติดต่อผู้ดูแลระบบ</a>
            </div> */}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-[#707974] gap-4">
        <div className="flex items-center gap-2">
          <span>© 2026 Cemetery Management System</span>
          <span className="opacity-30">•</span>
          {/* <a href="#" className="hover:text-[#003527]">นโยบายความเป็นส่วนตัว</a> */}
        </div>
        <div className="flex items-center gap-4">
          {/* <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#003527]">
            <Globe size={12} />
            <span>ภาษาไทย</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#003527]">
            <HelpCircle size={12} />
            <span>ศูนย์ความช่วยเหลือ</span>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
