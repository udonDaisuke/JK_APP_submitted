mainmatter()

function mainmatter(){
    // 各インスタンスの生成
    var Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Events = Matter.Events;
        
    // create an engine
    var engine = Engine.create({
        //各種イタレーションの設定(小さいほど、精度×、動作〇)
        constraintIterations:1, 
        positionIterations:3,
        velocityIterations:1,
        //重力設定
        gravity:{scale:0.006}
    });
    
    //レンダラー設定
    const canvas = $('#matter-area')[0]; //リスト渡し？
    //描画エリアサイズ
    const w_height = 800;
    const w_width = 800;
    var render = Render.create({
        element: canvas,
        engine: engine,
        options: {
            width : w_width,
            height : w_height,
            wireframes : false, //trueにするとフレームのみの表示になる
            background : "#e6e62e" //暗めの黄色
        }
    });
    
    //ボックス配置
    const box_size = 8; //8未満だと重いきがする
    //1ペンあたりのボックス配置数を計算
    const box_max_num = w_height/(box_size);
    //ボックス配置用のシフト量
    const box_posx0 = 0+0.5*box_size;
    const box_posy0 = 0+0.5*box_size;
    
    //ボックスのコンテナ(Bodiesを格納)
    var boxrow = []; 
    //ボックス色変更のコンテナ
    var color_next = []; 
    
    //ボックスをループさせる、2次元配列的なアクセス
    // -1,box_max_numは表示範囲外
    for (let i = -1; i < box_max_num+1; i++) {
    for (let j = -1; j < box_max_num+1; j++) {
        //ボックス配色の設定
        var RGB_stat = [0,0,0];//色指定用配列
        var rand = Math.floor((Math.random()+Math.random())*1.5) //0~2で1を中央とした正規乱数
        RGB_stat[rand] = 255; //1つ255,他0となる    
        colorRGB = "rgb("+RGB_stat[0]+","+RGB_stat[1]+","+RGB_stat[2]+")"
        var colorInfo = new RGBColor(colorRGB); //色名称変換用のモジュールへつっこむ
        // 描画範囲外１マス範囲に白ボックスを配置
        if (i==-1||j==-1||i==box_max_num||j==box_max_num){
            var element = Bodies.rectangle(box_posx0+i*box_size, box_posy0+j*box_size, box_size, box_size,{ 
            isStatic: true,
            render: {fillStyle: "white",strokeStyle: "yellow",lineWidth:0}
            });
        //乱数で決めてrgbいずれかの色のボックスを配置
        }else{
            var element = Bodies.rectangle(box_posx0+i*box_size, box_posy0+j*box_size, box_size, box_size,{ 
            isStatic: true,
            render: {fillStyle: colorInfo.toHex(),strokeStyle: "yellow",lineWidth:0}       
            });
        };
        //生成したボックスをコンテナに格納
        boxrow.push(element);    
    }};
    
    // add all of the bodies to the world
    Composite.add(engine.world, boxrow);
    // run the renderer
    Render.run(render);
    // create runner
    var runner = Runner.create();
    // run the engine
    Runner.run(runner, engine);
    
    // taking picture
    var pic = $("canvas")[0].toDataURL();    
    
    //マウスイベントオン
    var mouse = Mouse.create(canvas);
    var mouseConstraint = MouseConstraint.create(engine,
        {mouse: mouse,
        constraint: {render: {visible: false}}
        });
    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;
    //event関数用のデータ初期値
    var focusBefore = boxrow[1];
    var colorChangeFlag = false;

    // !イベント系
    var id_lastselected=""
    // mousemove: ボックス情報取得、focusbodyの更新とハイライト更新
    Events.on(mouseConstraint,"mousemove",function(e){
        var focusbody = Matter.Query.point(boxrow,e.mouse.position)[0];
        //カーソル位置のボックスが変わったとき
        if (focusbody != focusBefore){
            Matter.Body.set(focusbody.render,{opacity:0.3});//現在地をハイライト
            Matter.Body.set(focusBefore.render,{opacity:1});//更新前のハイライトを解除
        } ; 
        //履歴を更新
        focusBefore = focusbody;
        
        //colorselectオプション設定値の取得
        colorselected = $("input[name='colorselect']:checked").val()
        // フラグオンなら色変更実施
        if (colorChangeFlag==true){
            changeColor(focusBefore,colorselected);
            id_lastselected=focusBefore.id; //ふぇす開催用id記録
        };
    });
    //mousedown: 色変更
    Events.on(mouseConstraint,"mousedown",function(e){
        
        var focusbody = Matter.Query.point(boxrow,e.mouse.position)[0];
        if (focusbody != focusBefore){
            Matter.Body.set(focusbody.render,{opacity:0.3});
            Matter.Body.set(focusBefore.render,{opacity:1});
        } ; 
        focusBefore = focusbody;
        colorselected = $("input[name='colorselect']:checked").val()
        if (colorChangeFlag==true){
            changeColor(focusBefore,colorselected);
            id_lastselected=focusBefore.id;
        };
    });
    //startdrag and enddrag: マウス移動開始～終了の間だけ色変更を許可
    Events.on(mouseConstraint,"startdrag",function(e){
            colorChangeFlag = true;
    });
    Events.on(mouseConstraint,"enddrag",function(e){
        colorChangeFlag = false;
    });

    function jangkeng(boxrow,box_max_num){
        // read option settings
        const festivalflag = $("input[name='JKfestival']").prop('checked');
        // console.log(festivalflag)
        var takemajority_rate= $("input[name='takemajority']").val()/100.0;
        const store_val = takemajority_rate;

        var row_selected = Math.ceil(id_lastselected/(box_max_num+2)); //box_max_num+2 = system size 
        var col_selected = id_lastselected-(row_selected-1)*(box_max_num+2);
        // var i_jkfes = row_selected-1;
        // var j_jkfes = col_selected-1;
        var j_jkfes = row_selected-1;
        var i_jkfes = col_selected-1;
        //jk fes影響範囲   
        var radius_fes = 0.24*box_max_num;

        let colorafter =[]
        for (let i = 0; i < box_max_num; i++) {
        for (let j = 0; j < box_max_num; j++) {
            takemajority_rate = store_val;
            var index1d = (j+1)*(box_max_num+2) + (i+1);
            const ishift= 1;
            const jshift= box_max_num;colorstat
            var colorstat = [0,0,0]; //r,g,b point initialize
            var selfcolor = boxrow[index1d].render["fillStyle"];
            var selfcolarray = [0,0,0];
            var indexcompare = [0,0,0]; //index to confirm winner
            var indexcol = -1; //{0:red, 1:green, 2:blue}
            if (selfcolor=="#ff0000"){selfcolarray[0]=255 ; indexcol = 0 ; indexcompare[indexcol]=1}; //red -> confirm green exist(r<g)
            if (selfcolor=="#00ff00"){selfcolarray[1]=255 ; indexcol = 1 ;indexcompare[indexcol]=2}; //green -> confirm blue exist(g<b)
            if (selfcolor=="#0000ff"){selfcolarray[2]=255 ; indexcol = 2 ;indexcompare[indexcol]=0}; //blue -> confirm red exist(b<r)
            // console.log(takemajority_rate)
            // for (let dx = -1; dx < 2; dx+=2){
            // for (let dy = -1; dy < 2; dy+=2){
            for (let dx = -1; dx < 2; dx++){
            for (let dy = -1; dy < 2; dy++){

                if(dx==0 && dy==0){continue};
                var index1d_tmp = (j+1+dy)*(box_max_num+2) + (i+1+dx);
                var sampling_color = boxrow[index1d_tmp].render["fillStyle"]
                // if red
                if (sampling_color =="#ff0000"){
                    colorstat[0]+=255;
                    // console.log("red")
                // if green(lime)
                }else if(sampling_color =="#00ff00"){
                    colorstat[1]+=255;
                    // console.log("lime")
                // if blue
                }else if(sampling_color =="#0000ff"){
                    colorstat[2]+=255;
                    // console.log("blue")
                // if white or other
                }else{
                    colorstat[0]+=0;
                    colorstat[1]+=0;
                    colorstat[2]+=0;
                    // console.log(dx,dy,"other")
                };
            }};
            // judgement
            let judge = "";
            let allcolor=[colorstat[0]+selfcolarray[0],
                            colorstat[1]+selfcolarray[1],
                            colorstat[2]+selfcolarray[2]];
            
            //[3colors/1color] draw in neighbors due to rgb exist or unique color
            if (Math.min.apply(null,allcolor)>0 ||allcolor.filter((element)=>element==0).lengtn==2){
                // judge = "keep";
                // judge = Math.floor(Math.random()*4);  //black box

                if(festivalflag==true){
                    // console.log("fes!!!!!!!")
                    var fes_rate = Math.sqrt((i-i_jkfes)**2+(j-j_jkfes)**2)/radius_fes;
                    // console.log(fes_rate);
                    if (fes_rate < 1){takemajority_rate=fes_rate;}; 
                };
                if(Math.random()<takemajority_rate){
                    judge = allcolor.indexOf(Math.max.apply(null,allcolor)); // majority 
                }else{
                    var majority_index = allcolor.indexOf(Math.max.apply(null,allcolor));
                    var except_maj = allcolor.filter((element)=>(element)!=(allcolor[majority_index]));
                    // judge = Math.floor(Math.random()*3); // majority
                    if (except_maj.length==0){
                        judge=Math.floor(Math.random()*3);
                    }else{ 
                        var except_maj_index = [0,1,2].filter((element)=>element!=majority_index);
                        judge = except_maj_index[Math.floor(Math.random()*2)];
                    };
                };
                // judge = Math.floor(Math.random()*4);

                //[2colors]  (weak) <b<r<g<b (strong)
            }else if(colorstat[indexcompare[indexcol]] >0){ //if true, lose
                judge = indexcompare[indexcol] //use it as index to change color
            }else{
                judge = "keep" // win       
            };
            if (judge != "keep"){colorafter.push([index1d,judge])};
            // console.log(colorafter)
            
        }};

        takemajority_rate = store_val; //initialize

        return colorafter //list of list[index:int, changecolor:int] 
    };

    function changeColor(body, RGBstr){
        var colorchanged = ""
        if (RGBstr=="R"){
            Matter.Body.set(body.render,{fillStyle : "#ff0000"});
        }else if (RGBstr=="G"){
            Matter.Body.set(body.render,{fillStyle : "#00ff00"});
        }else if (RGBstr=="B"){
            Matter.Body.set(body.render,{fillStyle : "#0000ff"});
        }else{
            Matter.Body.set(body.render,{fillStyle : "#ffffff"});
        };
         // taking picture
        var pic = $("canvas")[0].toDataURL();    

    };

    function calcNormal() {
        // 正規乱数
        const r1 = Math.random();
        const r2 = Math.random();
        let value = Math.sqrt(-2.0 * Math.log(r1)) * Math.sin(2.0 * Math.PI * r2);
        // 値を0以上1未満になるよう正規化する
        value = (value + 3) / 6;
        return value;
    };


    // ボタンクリック：replay
    $("#replay-btn").click(function (e) { 
        location.reload();
    });

    // ボタンクリック：flush
    $("#flush-btn").click(function (e) {
        render.options["pixelRatio"]=1;
        Matter.Events.off(mouseConstraint,"mousemove") 
        Matter.Events.off(mouseConstraint,"mousedown") 
        Matter.Events.off(mouseConstraint,"startdrag") 
        Matter.Events.off(mouseConstraint,"enddrag") 

        for (let el in boxrow){
            Matter.Body.setStatic(boxrow[el],false);
            Matter.Body.set(boxrow[el],{flictionAir: Math.random()*100000,
                                        restitution: Math.random()*10});
        }    
    });

    // ボタンクリック：jk
    $("#jang-keng").click(function (e) { 
        result = jangkeng(boxrow,box_max_num);
        result.forEach(info => {
            color_next=[0,0,0];
            color_next[info[1]]=255;
            colortmp = "rgb("+color_next[0]+","+color_next[1]+","+color_next[2]+")";
            var colorchanged = new RGBColor(colortmp).toHex()
            Matter.Body.set(boxrow[info[0]].render,{fillStyle : colorchanged});
        });
    });

    // ボタンクリック：auto-jk
    var autojkflag=false;
    $("#jang-keng-auto").click(function (e) {
        var jkspeed=500/($("input[name='jk-speed']").val()); 

        autojkflag = !autojkflag;
        var setI = setInterval(function(){
            if(autojkflag==true){
                $("#jang-keng").trigger("click")
            }else{
                clearInterval(setI);
            };
            $("#jang-keng-auto").on("change",function(){
                clearInterval(setI);

            });
        },jkspeed);

        function singlejk(){
            if(autojkflag==true){
            };
        }; 
    });


};

