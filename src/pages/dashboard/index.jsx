import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#003527] mb-4">แผงควบคุม (Dashboard)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#eceeeb]">
          <p className="text-sm text-[#707974] mb-1">หลุมทั้งหมด</p>
          <p className="text-3xl font-bold text-[#003527]">1,240</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#eceeeb]">
          <p className="text-sm text-[#707974] mb-1">หลุมว่าง</p>
          <p className="text-3xl font-bold text-[#2b6954]">450</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#eceeeb]">
          <p className="text-sm text-[#707974] mb-1">สัญญาที่หมดอายุ</p>
          <p className="text-3xl font-bold text-[#ba1a1a]">12</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
