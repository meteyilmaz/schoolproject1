  const lessons = {
    matematik:{ question:"3 + 4 = kaçtır?", answers:[{text:"7",correct:true},{text:"8",correct:false}] },
    fen:{ question:"Güneş hangi yıldız türüne aittir?", answers:[{text:"Güneş bir yıldızdır",correct:true},{text:"Ay bir yıldızdır",correct:false}] },
    turkce:{ question:"Türkiye'nin başkenti hangisidir?", answers:[{text:"Ankara",correct:true},{text:"İstanbul",correct:false}] }
  };

  const lessonBtns = document.querySelectorAll('.lesson-btn');
  const qEl = document.getElementById('question');
  const answerBtns = document.querySelectorAll('.answer-btn');

  let current = 'turkce';

  load(current);
  setActive(current);

  lessonBtns.forEach(btn=>{
    btn.onclick = ()=>{
      const key = btn.dataset.lesson;
      current = key;
      setActive(key);
      load(key);
    };
  });

  function setActive(key){
    lessonBtns.forEach(b=>{
      b.setAttribute('aria-pressed', b.dataset.lesson === key ? 'true' : 'false');
    });
  }

  function load(key){
    const l = lessons[key];
    qEl.textContent = l.question;
    answerBtns[0].querySelector('.text').textContent = l.answers[0].text;
    answerBtns[0].dataset.correct = l.answers[0].correct;
    answerBtns[1].querySelector('.text').textContent = l.answers[1].text;
    answerBtns[1].dataset.correct = l.answers[1].correct;

    answerBtns.forEach(b=>{
      b.disabled=false;
      b.classList.remove('correct','wrong');
    });
  }

  answerBtns.forEach(btn=>{
    btn.onclick = ()=>{
      answerBtns.forEach(b=>b.disabled=true);
      btn.classList.add(btn.dataset.correct==="true" ? "correct" : "wrong");
    };
  });