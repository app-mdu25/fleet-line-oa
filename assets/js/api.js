(function(){
  const mockState = {
    me:{userId:'USR-001',displayName:'สมชาย ใจดี',departmentId:'DEP-001',departmentName:'งานบริหารทั่วไป',roles:['USER','DEPT_HEAD']},
    vehicles:[
      {vehicleId:'VEH-001',plateNo:'กข 1234',brand:'Toyota',model:'Commuter',vehicleType:'VAN',seatCapacity:11,status:'AVAILABLE'},
      {vehicleId:'VEH-002',plateNo:'ขข 5678',brand:'Toyota',model:'Hiace',vehicleType:'VAN',seatCapacity:11,status:'AVAILABLE'},
      {vehicleId:'VEH-003',plateNo:'คค 4455',brand:'Toyota',model:'Fortuner',vehicleType:'SUV',seatCapacity:7,status:'MAINTENANCE'}
    ],
    requests:[
      {requestId:'REQ-261003-0001',requesterName:'สมชาย ใจดี',purpose:'ประชุมประจำเดือน',destination:'ศาลากลางจังหวัด',startAt:'2026-10-08T08:30:00+07:00',endAt:'2026-10-08T16:30:00+07:00',status:'APPROVED',assignedVehicleId:'VEH-001',plateNo:'กข 1234'},
      {requestId:'REQ-261003-0002',requesterName:'นางสาวอารีย์',purpose:'ส่งเอกสารด่วน',destination:'สำนักงานเขต',startAt:'2026-10-05T10:00:00+07:00',endAt:'2026-10-05T12:00:00+07:00',status:'PENDING_L1'}
    ]
  };

  async function getIdToken(){
    if(window.liff && liff.isLoggedIn && liff.isLoggedIn()) return liff.getIDToken();
    return 'MOCK_TOKEN';
  }

  async function call(action,payload={}){
    if(window.APP_CONFIG.USE_MOCK) return mock(action,payload);
    const token=await getIdToken();
    const res=await fetch(window.APP_CONFIG.API_BASE_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,payload,idToken:token})});
    if(!res.ok) throw new Error('API '+res.status);
    const json=await res.json();
    if(!json.ok) throw new Error(json.error||'Unknown API error');
    return json.data;
  }

  async function mock(action,payload){
    await new Promise(r=>setTimeout(r,220));
    if(action==='auth.me') return mockState.me;
    if(action==='vehicles.availability') return mockState.vehicles.filter(v=>v.status==='AVAILABLE');
    if(action==='requests.my'||action==='requests.department') return mockState.requests;
    if(action==='approvals.pending') return mockState.requests.filter(r=>r.status==='PENDING_L1'||r.status==='PENDING_L2');
    if(action==='dashboard.summary') return {todayAvailable:2,pending:1,approved:1,totalMonth:18,distanceMonth:1260,incidentsMonth:0};
    if(action==='requests.create'){
      const id='REQ-261003-'+String(mockState.requests.length+10).padStart(4,'0');
      mockState.requests.unshift({requestId:id,requesterName:mockState.me.displayName,status:'PENDING_L1',...payload});
      return {requestId:id,status:'PENDING_L1'};
    }
    if(action==='approvals.action'){
      const r=mockState.requests.find(x=>x.requestId===payload.requestId); if(r) r.status=payload.decision==='APPROVE'?'PENDING_L2':'REJECTED_L1'; return r;
    }
    if(action==='media.upload') return {mediaId:'MED-MOCK',fileUrl:'mock://file'};
    if(action==='usage.checkout'||action==='usage.return'||action==='incident.create') return {saved:true};
    return {};
  }
  window.API={call};
})();
