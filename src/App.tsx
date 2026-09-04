import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, MeshDistortMaterial } from "@react-three/drei";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Home, Target, CheckSquare, Flame, CalendarDays, BarChart3, Trophy, Settings,
  Bell, Search, Plus, Check, MoreHorizontal, Clock3, Sun, Moon, Rocket,
  Brain, Dumbbell, BookOpen, Droplets, ChevronRight, GripVertical,
  Sparkles as SparkleIcon, X, Play, Pause, RotateCcw, Trash2, Edit3,
  CheckCircle2, Circle, SlidersHorizontal, Save, Palette, Timer, ListChecks,
  ChevronLeft, ChevronDown, Zap, BellRing
} from "lucide-react";

type Theme = "cosmic" | "sunset" | "zen" | "ocean" | "aurora" | "cyber" | "paper" | "mono";
type TaskStatus = "todo" | "progress" | "done";
type Task = { id:number; title:string; category:string; time:string; status:TaskStatus; color:string; icon:string };
type Habit = { id:number; title:string; icon:string; done:number[]; streak:number; color:string };
type Goal = { id:number; title:string; icon:string; current:number; target:number; color:string };

const themes:Record<Theme,{name:string;icon:string;description:string}> = {
  cosmic:{name:"Cosmic Focus",icon:"🚀",description:"Deep focus. Infinite possibilities."},
  sunset:{name:"Sunset Momentum",icon:"🌅",description:"Warmth. Energy. Momentum."},
  zen:{name:"Zen Garden",icon:"🌿",description:"Peaceful. Minimal. Balanced."},
  ocean:{name:"Ocean Deep",icon:"🌊",description:"Dive deep. Stay focused."},
  aurora:{name:"Aurora Calm",icon:"🌌",description:"Calm mind. Clear focus."},
  cyber:{name:"Cyber Minimal",icon:"🟢",description:"Clean. Sharp. Futuristic."},
  paper:{name:"Paper + Neon",icon:"📄",description:"Clean paper with a neon twist."},
  mono:{name:"Monochrome Pro",icon:"◐",description:"Timeless. Professional. Powerful."},
};

const initialTasks:Task[] = [
 {id:1,title:"Study DSA (2+ hrs)",category:"Study",time:"1h 30m",status:"done",color:"cyan",icon:"🧠"},
 {id:2,title:"Build ToDo App UI",category:"Project",time:"2h",status:"progress",color:"violet",icon:"🚀"},
 {id:3,title:"Exercise / Workout",category:"Health",time:"45m",status:"todo",color:"orange",icon:"🏋️"},
 {id:4,title:"Read 20 pages",category:"Learning",time:"30m",status:"todo",color:"teal",icon:"📚"},
 {id:5,title:"Drink 2L Water",category:"Health",time:"All day",status:"done",color:"green",icon:"💧"},
 {id:6,title:"Plan tomorrow",category:"Personal",time:"15m",status:"todo",color:"pink",icon:"✨"},
];
const initialHabits:Habit[] = [
 {id:1,title:"Drink Water",icon:"💧",done:[1,1,1,1,1,0,0],streak:12,color:"cyan"},
 {id:2,title:"Exercise",icon:"🏋️",done:[1,1,1,1,0,0,0],streak:5,color:"pink"},
 {id:3,title:"Read Book",icon:"📖",done:[1,1,1,1,1,0,0],streak:7,color:"orange"},
 {id:4,title:"Meditate",icon:"🪷",done:[1,1,1,0,1,0,0],streak:3,color:"violet"},
];
const initialGoals:Goal[] = [
 {id:1,title:"Master DSA",icon:"📚",current:18,target:25,color:"violet"},
 {id:2,title:"Build Portfolio",icon:"💻",current:8,target:12,color:"cyan"},
 {id:3,title:"Fitness Routine",icon:"🏃",current:14,target:20,color:"pink"},
];

function Crystal(){
 const ref:any={current:null};
 useFrame((_,d)=>{if(ref.current){ref.current.rotation.y+=d*.35;ref.current.rotation.x+=d*.12}});
 return <Float speed={2} rotationIntensity={.35} floatIntensity={1.25}>
   <mesh ref={ref} scale={1.05}><icosahedronGeometry args={[1,1]}/><MeshDistortMaterial color="#8b5cf6" emissive="#351a78" emissiveIntensity={1.5} roughness={.14} metalness={.7} distort={.3} speed={2}/></mesh>
   <Sparkles count={28} scale={4} size={2} speed={.5}/>
 </Float>
}

function SortableTask({task,onToggle,onDelete,onCycle}:{task:Task,onToggle:()=>void,onDelete:()=>void,onCycle:()=>void}){
 const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id:task.id});
 const style={transform:CSS.Transform.toString(transform),transition};
 return <motion.div layout ref={setNodeRef} style={style} {...attributes} className={`task-row ${isDragging?"dragging":""} ${task.status==="done"?"completed":""}`}>
   <button aria-label="complete task" className={`check ${task.status==="done"?"checked":""}`} onClick={onToggle}>{task.status==="done"?<Check size={15}/>:<Circle size={12}/>}</button>
   <span className="task-emoji">{task.icon}</span>
   <div className="task-main"><div className="task-title">{task.title}</div><div className="task-meta"><span className={`tag ${task.color}`}>{task.category}</span><span><Clock3 size={12}/>{task.time}</span><span className={`status-dot ${task.status}`}>{task.status === "progress" ? "In progress" : task.status === "todo" ? "To do" : "Done"}</span></div></div>
   <button className="cycle" title="Change status" onClick={onCycle}><ChevronDown size={15}/></button>
   <button className="drag" {...listeners} title="Drag to reorder"><GripVertical size={17}/></button>
   <button className="more" title="Delete task" onClick={onDelete}><Trash2 size={16}/></button>
 </motion.div>
}

function SectionTitle({icon,children,badge}:{icon:any;children:any;badge?:string}){return <div className="section-title">{icon}<span>{children}</span>{badge&&<b>{badge}</b>}</div>}

function App(){
 const [dark,setDark]=useState(true);
 const [theme,setTheme]=useState<Theme>(()=>(localStorage.getItem("ff-theme") as Theme)||"cosmic");
 const [tasks,setTasks]=useState<Task[]>(()=>{try{return JSON.parse(localStorage.getItem("ff-tasks")||"null")||initialTasks}catch{return initialTasks}});
 const [habits,setHabits]=useState<Habit[]>(()=>{try{return JSON.parse(localStorage.getItem("ff-habits")||"null")||initialHabits}catch{return initialHabits}});
 const [goals,setGoals]=useState<Goal[]>(()=>{try{return JSON.parse(localStorage.getItem("ff-goals")||"null")||initialGoals}catch{return initialGoals}});
 const [filter,setFilter]=useState("All");
 const [showAdd,setShowAdd]=useState(false);
 const [newTask,setNewTask]=useState("");
 const [newTaskTime,setNewTaskTime]=useState("30m");
 const [newTaskCategory,setNewTaskCategory]=useState("Personal");
 const [active,setActive]=useState("Home");
 const [pomodoro,setPomodoro]=useState(25*60);
 const [running,setRunning]=useState(false);
 const [focusLength,setFocusLength]=useState(25);
 const [searchOpen,setSearchOpen]=useState(false);
 const [search,setSearch]=useState("");
 const [noticeOpen,setNoticeOpen]=useState(false);
 const [settingsSaved,setSettingsSaved]=useState(false);
 const [showGoalForm,setShowGoalForm]=useState(false);
 const [goalTitle,setGoalTitle]=useState("");
 const [showHabitForm,setShowHabitForm]=useState(false);
 const [habitTitle,setHabitTitle]=useState("");
 const [calendarOffset,setCalendarOffset]=useState(0);

 useEffect(()=>localStorage.setItem("ff-tasks",JSON.stringify(tasks)),[tasks]);
 useEffect(()=>localStorage.setItem("ff-habits",JSON.stringify(habits)),[habits]);
 useEffect(()=>localStorage.setItem("ff-goals",JSON.stringify(goals)),[goals]);
 useEffect(()=>localStorage.setItem("ff-theme",theme),[theme]);
 useEffect(()=>{document.documentElement.classList.toggle("light",!dark);document.documentElement.dataset.theme=theme},[dark,theme]);
 useEffect(()=>{if(!running)return;const t=setInterval(()=>setPomodoro(v=>{if(v<=1){setRunning(false);return focusLength*60}return v-1}),1000);return()=>clearInterval(t)},[running,focusLength]);

 const done=tasks.filter(t=>t.status==="done").length;
 const progress=tasks.filter(t=>t.status==="progress").length;
 const total=tasks.length;
 const percent=total?Math.round(done/total*100):0;
 const visible=useMemo(()=>filter==="All"?tasks:filter==="Done"?tasks.filter(t=>t.status==="done"):filter==="To Do"?tasks.filter(t=>t.status==="todo"):tasks.filter(t=>t.status==="progress"),[filter,tasks]);
 const time=`${String(Math.floor(pomodoro/60)).padStart(2,"0")}:${String(pomodoro%60).padStart(2,"0")}`;
 const today=new Date();
 const week=Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-today.getDay()+1+i+calendarOffset*7);return d});

 const addTask=()=>{if(!newTask.trim())return;setTasks(v=>[...v,{id:Date.now(),title:newTask.trim(),category:newTaskCategory,time:newTaskTime,status:"todo",color:"violet",icon:"✨"}]);setNewTask("");setShowAdd(false)};
 const cycleStatus=(id:number)=>setTasks(v=>v.map(t=>t.id!==id?t:{...t,status:t.status==="todo"?"progress":t.status==="progress"?"done":"todo"}));
 const dragEnd=({active,over}:DragEndEvent)=>{if(!over||active.id===over.id)return;setTasks(v=>{const a=v.findIndex(x=>x.id===active.id),b=v.findIndex(x=>x.id===over.id);return arrayMove(v,a,b)})};
 const toggleHabit=(hi:number,day:number)=>setHabits(v=>v.map(h=>h.id===hi?{...h,done:h.done.map((x,i)=>i===day?x?0:1:x),streak:Math.max(0,h.streak+(h.done[day]? -1:1))}:h));
 const addGoal=()=>{if(!goalTitle.trim())return;setGoals(v=>[...v,{id:Date.now(),title:goalTitle.trim(),icon:"🎯",current:0,target:10,color:"violet"}]);setGoalTitle("");setShowGoalForm(false)};
 const addHabit=()=>{if(!habitTitle.trim())return;setHabits(v=>[...v,{id:Date.now(),title:habitTitle.trim(),icon:"✨",done:[0,0,0,0,0,0,0],streak:0,color:"violet"}]);setHabitTitle("");setShowHabitForm(false)};
 const searchResults=search.trim()?tasks.filter(t=>t.title.toLowerCase().includes(search.toLowerCase())||t.category.toLowerCase().includes(search.toLowerCase())):[];
 const setFocus=(mins:number)=>{setFocusLength(mins);setPomodoro(mins*60);setRunning(false)};

 const nav=[ [Home,"Home"],[Target,"Goals"],[CheckSquare,"Tasks"],[Flame,"Habits"],[CalendarDays,"Calendar"],[BarChart3,"Analytics"],[Trophy,"Achievements"],[Settings,"Settings"] ];

 return <div className="app">
   <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><SparkleIcon size={20}/></div><span>Focus<span>Flow</span></span></div>
    <div className="theme-chip"><span className="theme-orb"></span><div><b>{themes[theme].name}</b><small>Premium theme</small></div><ChevronDown size={13}/></div>
    <nav>{nav.map(([I,n]:any)=><button key={n} className={active===n?"nav active":"nav"} onClick={()=>setActive(n)}><I size={18}/><span>{n}</span>{n==="Tasks"&&<b>{tasks.filter(t=>t.status!=="done").length}</b>}</button>)}</nav>
    <div className="side-astronaut"><div className="planet"></div><div className="astronaut">👨‍🚀</div><div className="side-caption">Stay focused.<br/><span>You've got this.</span></div></div>
    <div className="profile"><div className="avatar">A</div><div><strong>Abhishek</strong><small>Level 12 · 1,240 XP</small></div><ChevronRight size={15}/></div>
   </aside>

   <main>
    <header><div><p className="eyebrow">{today.toLocaleDateString(undefined,{weekday:"long"}).toUpperCase()} · {today.toLocaleDateString(undefined,{month:"short",day:"numeric"}).toUpperCase()}</p><h1>{active==="Home"?<>Good morning, <em>Abhishek</em> 👋</>:active}</h1><p className="sub">{active==="Home"?"Make today count. Small steps, big momentum.":`Your ${active.toLowerCase()} at a glance.`}</p></div>
      <div className="head-actions"><button className="icon-btn" onClick={()=>setSearchOpen(true)}><Search size={18}/></button><button className="icon-btn bell" onClick={()=>setNoticeOpen(!noticeOpen)}><Bell size={18}/><i></i></button><button className="theme" onClick={()=>setDark(!dark)}>{dark?<Sun size={17}/>:<Moon size={17}/>}<span>{dark?"Light":"Dark"}</span></button></div>
    </header>

    {active==="Home"&&<>
      <div className="week"><button className="week-arrow" onClick={()=>setCalendarOffset(v=>v-1)}><ChevronLeft size={15}/></button>{week.map((d,i)=>{const isToday=d.toDateString()===today.toDateString();return <div className={`day ${i<4&&calendarOffset===0?"done":""} ${isToday?"today":""}`} key={d.toISOString()}><span>{d.toLocaleDateString(undefined,{weekday:"short"}).slice(0,1)}</span><b>{i<4&&calendarOffset===0?<Check size={13}/>:isToday?<span/>:d.getDate()}</b></div>})}<button className="week-arrow" onClick={()=>setCalendarOffset(v=>v+1)}><ChevronRight size={15}/></button></div>
      <section className="hero-grid">
       <div className="progress-card glass"><div><p className="eyebrow">TODAY'S PROGRESS</p><div className="progress-number">{percent}<small>%</small></div><p className="sub">{done} of {total} tasks completed · {progress} in progress</p></div><div className="ring" style={{"--p":`${percent*3.6}deg`} as any}><div>{percent}%</div></div><div className="mini-stat"><span>🔥</span><strong>5</strong><small>day streak</small></div></div>
       <div className="focus-card glass"><div className="orb"><Canvas camera={{position:[0,0,3.5]}}><ambientLight intensity={1}/><pointLight position={[2,2,3]} intensity={8}/><Crystal/></Canvas></div><div><p className="eyebrow">FOCUS MODE</p><strong>{time}</strong><p className="sub">Deep work session</p><div className="focus-presets">{[25,50,90].map(m=><button className={focusLength===m?"on":""} key={m} onClick={()=>setFocus(m)}>{m}m</button>)}</div></div><button className="play" onClick={()=>setRunning(!running)}>{running?<Pause size={17}/>:<Play size={17}/>}</button><button className="reset" onClick={()=>{setRunning(false);setPomodoro(focusLength*60)}}><RotateCcw size={15}/></button></div>
      </section>
      <section className="tasks-section"><div className="section-head"><div><SectionTitle icon={<SparkleIcon size={19}/>} badge={`${done}/${total}`}>Today's Tasks</SectionTitle><p className="sub">Drag to reorder · tap to complete</p></div><button className="add-btn" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add Task</button></div>
       <div className="filters">{["All","To Do","In Progress","Done"].map(f=><button key={f} className={filter===f?"selected":""} onClick={()=>setFilter(f)}>{f}</button>)}</div>
       <DndContext collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={visible.map(t=>t.id)} strategy={verticalListSortingStrategy}><div className="task-list">{visible.map(t=><SortableTask key={t.id} task={t} onToggle={()=>setTasks(v=>v.map(x=>x.id===t.id?{...x,status:x.status==="done"?"todo":"done"}:x))} onCycle={()=>cycleStatus(t.id)} onDelete={()=>setTasks(v=>v.filter(x=>x.id!==t.id))}/>)}</div></SortableContext></DndContext>
       <AnimatePresence>{showAdd&&<motion.div className="add-panel" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}><input autoFocus value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="What do you want to accomplish?"/><select value={newTaskCategory} onChange={e=>setNewTaskCategory(e.target.value)}><option>Personal</option><option>Study</option><option>Project</option><option>Health</option><option>Learning</option></select><input className="time-input" value={newTaskTime} onChange={e=>setNewTaskTime(e.target.value)} placeholder="30m"/><button onClick={addTask}>Add</button><button className="close" onClick={()=>setShowAdd(false)}><X size={17}/></button></motion.div>}</AnimatePresence>
      </section>
      <section className="lower-grid"><div className="glass habits"><div className="section-head"><div><SectionTitle icon={<Flame size={19}/>}>Habit Tracker</SectionTitle><p className="sub">Keep your streak alive</p></div><button className="small-plus" onClick={()=>setShowHabitForm(true)}><Plus size={17}/></button></div><div className="habit-list">{habits.map(h=><div className="habit" key={h.id}><span className="habit-icon">{h.icon}</span><div className="habit-name"><strong>{h.title}</strong><small>🔥 {h.streak} day streak</small></div><div className="habit-days">{h.done.map((x,i)=><button key={i} className={x?"hit":""} onClick={()=>toggleHabit(h.id,i)}>{x?<Check size={11}/>:["M","T","W","T","F","S","S"][i]}</button>)}</div></div>)}</div></div>
       <div className="glass goals"><div className="section-head"><div><SectionTitle icon={<Target size={19}/>}>Goals</SectionTitle><p className="sub">Build your future one milestone at a time</p></div><button className="small-plus" onClick={()=>setShowGoalForm(true)}><Plus size={17}/></button></div>{goals.map(g=>{const p=Math.min(100,Math.round(g.current/g.target*100));return <div className="goal" key={g.id}><div className="goal-icon">{g.icon}</div><div className="goal-main"><strong>{g.title}</strong><small>{g.current} / {g.target} tasks · {p}%</small><div className="bar"><i style={{width:`${p}%`}}></i></div></div><button className="goal-next" onClick={()=>setGoals(v=>v.map(x=>x.id===g.id?{...x,current:Math.min(x.target,x.current+1)}:x))}><Plus size={13}/></button><button className="more" onClick={()=>setGoals(v=>v.filter(x=>x.id!==g.id))}><Trash2 size={14}/></button></div>})}<div className="achievement"><span>🏆</span><div><strong>Week Warrior</strong><small>Complete tasks 7 days in a row</small></div><b>72%</b></div></div></section>
    </>}

    {active==="Tasks"&&<div className="page-card glass"><div className="big-page-head"><div><SectionTitle icon={<ListChecks size={21}/>} badge={`${total}`}>Task Command Center</SectionTitle><p className="sub">Create, complete, reorder and manage every task.</p></div><button className="add-btn" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add Task</button></div><div className="filters large">{["All","To Do","In Progress","Done"].map(f=><button key={f} className={filter===f?"selected":""} onClick={()=>setFilter(f)}>{f}</button>)}</div><DndContext collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={visible.map(t=>t.id)} strategy={verticalListSortingStrategy}><div className="task-list">{visible.map(t=><SortableTask key={t.id} task={t} onToggle={()=>setTasks(v=>v.map(x=>x.id===t.id?{...x,status:x.status==="done"?"todo":"done"}:x))} onCycle={()=>cycleStatus(t.id)} onDelete={()=>setTasks(v=>v.filter(x=>x.id!==t.id))}/>)}</div></SortableContext></DndContext></div>}

    {active==="Goals"&&<div className="page-card glass"><div className="big-page-head"><div><SectionTitle icon={<Target size={21}/>}>Goals & Milestones</SectionTitle><p className="sub">Turn big ambitions into measurable progress.</p></div><button className="add-btn" onClick={()=>setShowGoalForm(true)}><Plus size={17}/> New Goal</button></div><div className="goal-grid">{goals.map(g=>{const p=Math.min(100,Math.round(g.current/g.target*100));return <motion.div layout className="goal-card" key={g.id}><div className="goal-card-top"><span className="goal-icon">{g.icon}</span><button className="more" onClick={()=>setGoals(v=>v.filter(x=>x.id!==g.id))}><Trash2 size={15}/></button></div><h3>{g.title}</h3><p>{g.current} of {g.target} milestones</p><div className="bar"><i style={{width:`${p}%`}}/></div><div className="goal-card-foot"><b>{p}% complete</b><button onClick={()=>setGoals(v=>v.map(x=>x.id===g.id?{...x,current:Math.min(x.target,x.current+1)}:x))}>Complete milestone <Plus size={13}/></button></div></motion.div>})}</div></div>}

    {active==="Habits"&&<div className="page-card glass"><div className="big-page-head"><div><SectionTitle icon={<Flame size={21}/>}>Habit Orbit</SectionTitle><p className="sub">Tap a day to mark your habit complete.</p></div><button className="add-btn" onClick={()=>setShowHabitForm(true)}><Plus size={17}/> New Habit</button></div><div className="habit-big-grid">{habits.map(h=><div className="habit-big" key={h.id}><div className="habit-big-head"><span className="habit-icon">{h.icon}</span><div><h3>{h.title}</h3><small>🔥 {h.streak} day streak</small></div></div><div className="habit-days big">{h.done.map((x,i)=><button key={i} className={x?"hit":""} onClick={()=>toggleHabit(h.id,i)}><span>{x?<Check size={13}/>:""}</span>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</button>)}</div></div>)}</div></div>}

    {active==="Calendar"&&<div className="page-card glass"><div className="big-page-head"><div><SectionTitle icon={<CalendarDays size={21}/>}>Weekly Calendar</SectionTitle><p className="sub">A simple view of your focus rhythm.</p></div><div className="calendar-controls"><button onClick={()=>setCalendarOffset(v=>v-1)}><ChevronLeft size={16}/></button><button onClick={()=>setCalendarOffset(0)}>Today</button><button onClick={()=>setCalendarOffset(v=>v+1)}><ChevronRight size={16}/></button></div></div><div className="calendar-grid">{week.map((d,i)=><div className={`calendar-day ${d.toDateString()===today.toDateString()?"selected":""}`} key={d.toISOString()}><b>{d.toLocaleDateString(undefined,{weekday:"short"})}</b><strong>{d.getDate()}</strong><div>{tasks.slice(i%3,Math.min(tasks.length,i%3+3)).map(t=><span key={t.id} className={t.status}>{t.icon} {t.title}</span>)}</div></div>)}</div></div>}

    {active==="Analytics"&&<div className="analytics-grid"><div className="page-card glass"><SectionTitle icon={<BarChart3 size={21}/>}>Weekly Momentum</SectionTitle><p className="sub">Tasks completed over the last 7 days.</p><div className="chart">{[42,58,51,76,63,84,92].map((v,i)=><div className="bar-col" key={i}><div className="bar-fill" style={{height:`${v}%`}}><span>{v}</span></div><small>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</small></div>)}</div></div><div className="page-card glass stats-card"><SectionTitle icon={<Zap size={21}/>}>Performance</SectionTitle><div className="stat-big">{percent}%<small>completion</small></div><div className="stat-row"><span>Completed</span><b>{done}</b></div><div className="stat-row"><span>In progress</span><b>{progress}</b></div><div className="stat-row"><span>Open</span><b>{tasks.filter(t=>t.status==="todo").length}</b></div><div className="stat-row"><span>Habits active</span><b>{habits.length}</b></div></div></div>}

    {active==="Achievements"&&<div className="page-card glass"><SectionTitle icon={<Trophy size={21}/>}>Achievements</SectionTitle><p className="sub">Small wins compound into momentum.</p><div className="achievement-grid">{[["🔥","Week Warrior","Complete tasks 7 days in a row",72],["⚡","Early Bird","Start a focus session before 9 AM",100],["🎯","Task Hunter","Complete 25 tasks",Math.min(100,done*4)],["💎","Goal Getter","Reach a goal milestone",Math.min(100,goals.reduce((a,g)=>a+g.current,0)*3)]].map(([icon,title,desc,p])=><div className="achievement-tile" key={title}><span>{icon}</span><div><h3>{title}</h3><p>{desc}</p><div className="bar"><i style={{width:`${p}%`}}/></div></div><b>{p}%</b></div>)}</div></div>}

    {active==="Settings"&&<div className="settings-grid"><div className="page-card glass"><SectionTitle icon={<Palette size={21}/>}>Appearance</SectionTitle><p className="sub">Make FocusFlow feel like your workspace.</p><div className="setting-row"><div><b>Color theme</b><small>Choose one of the premium visual systems.</small></div><select value={theme} onChange={e=>setTheme(e.target.value as Theme)}>{Object.entries(themes).map(([k,t])=><option value={k} key={k}>{t.name}</option>)}</select></div><div className="theme-picker">{Object.entries(themes).map(([k,t])=><button key={k} className={theme===k?"theme-choice active":"theme-choice"} onClick={()=>setTheme(k as Theme)}><span>{t.icon}</span><div><b>{t.name}</b><small>{t.description}</small></div></button>)}</div><div className="setting-row"><div><b>Dark mode</b><small>Switch between dark and light workspace.</small></div><button className="toggle" onClick={()=>setDark(!dark)}>{dark?<Moon size={15}/>:<Sun size={15}/>} {dark?"On":"Off"}</button></div><button className="save-settings" onClick={()=>{setSettingsSaved(true);setTimeout(()=>setSettingsSaved(false),1600)}}><Save size={16}/> {settingsSaved?"Saved":"Save preferences"}</button></div><div className="page-card glass"><SectionTitle icon={<Timer size={21}/>}>Focus Timer</SectionTitle><p className="sub">Set your preferred default session.</p><div className="timer-options">{[25,50,90].map(m=><button className={focusLength===m?"selected":""} key={m} onClick={()=>setFocus(m)}>{m} minutes</button>)}</div><div className="settings-note"><BellRing size={18}/><div><b>Everything is stored locally</b><small>Your tasks, goals, habits and preferences persist in this browser.</small></div></div></div></div>}
   </main>

   <div className="mobile-nav">{[[Home,"Home"],[CheckSquare,"Tasks"],[Plus,"Add"],[Flame,"Habits"],[BarChart3,"Stats"]].map(([I,n]:any)=><button key={n} onClick={()=>n==="Add"?setShowAdd(true):setActive(n==="Stats"?"Analytics":n)} className={active===(n==="Stats"?"Analytics":n)?"sel":""}><I size={20}/><span>{n}</span></button>)}</div>

   <AnimatePresence>{(searchOpen||noticeOpen||showGoalForm||showHabitForm)&&<div className="overlay" onMouseDown={()=>{if(searchOpen)setSearchOpen(false);if(noticeOpen)setNoticeOpen(false)}}>
    {searchOpen&&<motion.div className="modal search-modal" initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><Search size={18}/><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks and categories..."/><button onClick={()=>setSearchOpen(false)}><X size={18}/></button></div>{searchResults.length?<div className="search-results">{searchResults.map(t=><button key={t.id} onClick={()=>{setActive("Tasks");setSearchOpen(false)}}><span>{t.icon}</span><div><b>{t.title}</b><small>{t.category} · {t.status}</small></div><ChevronRight size={15}/></button>)}</div>:search?<div className="empty">No matching tasks.</div>:<div className="empty">Type to search your tasks.</div>}</motion.div>}
    {noticeOpen&&<motion.div className="modal notice-modal" initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><BellRing size={18}/><b>Notifications</b><button onClick={()=>setNoticeOpen(false)}><X size={18}/></button></div><div className="notification"><CheckCircle2 size={18}/><div><b>{done} tasks completed today</b><small>You're building momentum. Keep going!</small></div></div><div className="notification"><Flame size={18}/><div><b>5 day streak is alive</b><small>One more focused day keeps it rolling.</small></div></div></motion.div>}
    {showGoalForm&&<motion.div className="modal form-modal" initial={{scale:.96,opacity:0}} animate={{scale:1,opacity:1}} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><Target size={18}/><b>New Goal</b><button onClick={()=>setShowGoalForm(false)}><X size={18}/></button></div><input autoFocus value={goalTitle} onChange={e=>setGoalTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGoal()} placeholder="Goal name"/><button className="add-btn" onClick={addGoal}>Create Goal</button></motion.div>}
    {showHabitForm&&<motion.div className="modal form-modal" initial={{scale:.96,opacity:0}} animate={{scale:1,opacity:1}} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><Flame size={18}/><b>New Habit</b><button onClick={()=>setShowHabitForm(false)}><X size={18}/></button></div><input autoFocus value={habitTitle} onChange={e=>setHabitTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHabit()} placeholder="Habit name"/><button className="add-btn" onClick={addHabit}>Create Habit</button></motion.div>}
   </div>}</AnimatePresence>
 </div>
}
export default App;
