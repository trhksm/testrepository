const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const crypto = require('crypto')
const mysql = require('mysql2/promise');
const fs = require("fs");
const ejs = require("ejs");


//mysql接続 //自身のmysqlを使うにはここのみ変更
async function dbConnect(){
    let db = await mysql.createConnection({
        host: '153.126.217.122',  //mysqlhost変更
        user: 'remote',           //mysqluser変更 
        password: 'remotepass',   //password変更
        database: 'shift_system'  //database変更
    });
    return db;
}

//mysql接続終了
async function dbEnd(db){
    if (db) {
        await db.end();
    }
}

//shifts追加&更新
async function shiftPut(u,d,s,f,c){
    console.log({ u,d,s,f,c});
    let db = await dbConnect();
    const [rows] = await db.execute('SELECT id FROM shifts WHERE username = ? AND date = ? AND ena = TRUE', [u, d]);
    if (rows.length > 0) {
	await db.execute('UPDATE shifts SET ena = FALSE WHERE username = ? AND date = ?',[u,d]);
    }
    await db.execute('INSERT INTO shifts (username, date, stime, ftime, comment) VALUES (?,?,?,?,?)',[u,d,s,f,c]);
    await dbEnd(db);
}

//password追加
async function passwordInsert(u,p){
    let db = await dbConnect();
    await db.execute('INSERT INTO users_passwords (username, password) VALUES (?, ?)',[u,p]);
    await dbEnd(db);
}

//token追加
async function tokenInsert(u,t){
    let db = await dbConnect();
    // 既存のトークンを無効化
    await db.execute('UPDATE users_tokens SET ena = FALSE WHERE username = ?', [u]);
    // 新しいトークンを有効で挿入
    await db.execute('INSERT INTO users_tokens (username, token, ena) VALUES (?, ?, TRUE)', [u, t]);
    await dbEnd(db);
}

//table読み取り
async function tableSelect(t){
    let db = await dbConnect();
    const [rows] = await db.query(`SELECT * FROM ${t}`);
    await dbEnd(db);
    return rows;
}

//token削除
async function tokenDelete(u){
    let db = await dbConnect();
    await db.execute(`UPDATE users_tokens SET ena = FALSE WHERE username = ?`, [u]);
    await dbEnd(db);
}

//shift削除
async function shiftDelete(u,d){
    let db = await dbConnect();
    await db.execute('UPDATE shifts SET ena = FALSE WHERE username = ? AND date = ?', [u,d]);
    await dbEnd(db);
}

//token生成＋cookie保存
async function tokenGenerateSave(u,res){
    const token = generateToken();
    //cookieに保存
    res.setHeader('Set-Cookie', [
	`name=${u}; Max-Age=3600; Path=/; HttpOnly`,
	`token=${token}; Max-Age=3600; Path=/; HttpOnly`
    ]);
    //name+tokenサーバー側に保存
    await tokenInsert(u,token)
}

//error画面表示
async function sendError(res, message, link ,place) {
    const html_error = await ejs.renderFile(`${__dirname}/webapp5_ejs/error.ejs`, {
	message:message,
	link:link,
	place:place,
    });
    res.status(400).send(html_error);
}

//ハッシュ化(sha256) ハッシュオブジェクト.引数とUTF8エンコーディング文字列指定.16進で文字数省略
function sha256(t) {
    return crypto.createHash('sha256').update(t, 'utf8').digest('hex');
}

//時刻を分に換算
function TtoM(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

//トークンを制作
function generateToken(){
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const tokenLength = 64;
    let token ='';
    for (let i = 0;i < tokenLength;i++){
	const randomIndex = Math.floor(Math.random()*characters.length);
	token += characters[randomIndex];
    }
    return token;
}

//cookie読み取り
function parseCookies(req){
    const list = {};
    const headercookies = req.headers.cookie;
    if (headercookies){
	headercookies.split(';').forEach(cookie => {
	    const parts = cookie.split('=');
	    const key = parts[0].trim();
	    const val = decodeURIComponent(parts[1]);
	    list[key] = val
	});
    }
    return list;
}

//token確認
async function checkToken(req){
    let db = await dbConnect();
    //cookie読み込み
    const cookies = parseCookies(req);
    //ユーザのnameとtoken
    const name_token = cookies['name']+','+cookies['token']
    //サーバ側のnameとtokenリストにあるか
    const [rows] = await db.query('SELECT * FROM users_tokens WHERE ena = TRUE');
    const name_tokenlist = rows.map(row => row.username + ',' + row.token);
    await dbEnd(db);
    return name_tokenlist.includes(name_token);
}

//password確認
async function checkPassword(name,password){
    //ユーザのnameとtoken
    const name_password = name+','+password
    //サーバ側のnameとtokenリストにあるか
    const data = await tableSelect('users_passwords')
    const name_passwordlist = data.map(row => row.username + ',' + row.password);
    return name_passwordlist.includes(name_password);
}

//name確認
async function checkName(name){
    //サーバ側のnameリストにあるか
    const data = await tableSelect('users_passwords')
    const namelist = data.map(row => row.username);
    return namelist.includes(name);
}

//table取得
async function getTable(name){
    //シフト読み込み
    const db = await dbConnect();
    const [data] = await db.query(`SELECT username, DATE_FORMAT(date, '%Y-%m-%d') as date, stime, ftime, comment,stime_ena ,ftime_ena FROM shifts WHERE ena = TRUE ORDER BY date, CASE WHEN username = ? THEN 1 ELSE 2 END`, [name]);
    await dbEnd(db);
    //シフト表示形式用整理
    let table = await Promise.all(data.map(async (row) => {
	var stimeHM = row.stime.slice(0, 5);
	var ftimeHM = row.ftime.slice(0, 5);
	if(row.stime_ena == false){stimeHM = "99:99";}
	if(row.ftime_ena == false){ftimeHM = "99:99";}
	return await ejs.renderFile(`${__dirname}/webapp5_ejs/table.ejs`, {
	    row_username: row.username,
	    row_date: row.date,
	    stimeHM,
	    ftimeHM,
	    row_comment: row.comment,
	});
    }));
    return table.join('');
}

//readtable取得
async function getReadTable(name){
    //シフト読み込み
    const db = await dbConnect();
    const [data] = await db.query(`SELECT username, DATE_FORMAT(date, '%Y-%m-%d') as date, stime, ftime, comment,stime_ena ,ftime_ena FROM shifts WHERE ena = TRUE ORDER BY date, CASE WHEN username = ? THEN 1 ELSE 2 END`, [name]);
    await dbEnd(db);
    //シフト表示形式用整理
    let table = await Promise.all(data.map(async (row) => {
	var stimeHM = row.stime.slice(0, 5);
	var ftimeHM = row.ftime.slice(0, 5);
	if(row.stime_ena == false){stimeHM = "99:99";}
	if(row.ftime_ena == false){ftimeHM = "99:99";}
	return await ejs.renderFile(`${__dirname}/webapp5_ejs/tableread.ejs`, {
	    row_username: row.username,
	    row_date: row.date,
	    stimeHM,
	    ftimeHM,
	    row_comment: row.comment,
	});
    }));
    return table.join('');
}

async function main(){
    //ホーム画面表示
    app.get('/', async (req, res) => {
	//token確認
	if(await checkToken(req)){
	    //name取得
	    const cookies = parseCookies(req);
	    const username = cookies['name'];
	    const table = await getTable(username);
	    //ホーム画面HTML
	    const home_html = await ejs.renderFile(`${__dirname}/webapp5_ejs/home.ejs`, {
		username: username,
		table:table,
	    });
	    //画面表示
	    res.send(home_html);
	}else{
	    //ログイン画面へ
	    sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	}
    });
    
    //ホーム画面送信
    app.post('/', async (req, res) => {
	//token確認
	if(await checkToken(req)){
	    //name取得
	    const cookies = parseCookies(req);
	    const username = cookies['name'];
	    //年月日・出社時刻・退社時刻・コメント取得
	    const date = req.body.date;
	    console.log("skip_stime:", req.body.skip_stime);
	    console.log("skip_ftime:", req.body.skip_ftime);
	    console.log("stime:", req.body.stime);
	    console.log("ftime:", req.body.ftime);
	    var stime = "00:00:00";
	    if(req.body.skip_stime === 'false'){stime = req.body.stime;}
	    var ftime = "23:59:00";
	    if(req.body.skip_ftime === 'false'){ftime = req.body.ftime;}
	    console.log("final stime:", stime);
	    console.log("final ftime:", ftime);
	    console.log(stime,ftime);
	    const comment = req.body.comment;
	    //入社時刻と退社時刻の前後確認
	    const sm = TtoM(stime);
	    const fm = TtoM(ftime);
	    const now = new Date();
	    const work_start = new Date(date + 'T' + stime);
	    const work_end = new Date(date + 'T' + ftime);
	    if (sm >= fm) {
		var error_text = '出社時刻は退社時刻よりも前である必要があります';
		const table = await getTable(username);
		const html = await ejs.renderFile(`${__dirname}/webapp5_ejs/home.ejs`, {
		    username,
		    table,
		    error: error_text,
		    input_date: date,
		    input_stime: stime,
		    input_ftime: ftime,
		    input_comment: comment
		});
		res.status(400).send(html);
	    }else if (work_start < now && work_end < now) {
		var error_text = '過去の時刻は登録できません';
		const table = await getTable(username);
		const html = await ejs.renderFile(`${__dirname}/webapp5_ejs/home.ejs`, {
		    username,
		    table,
		    error: error_text,
		    input_date: date,
		    input_stime: stime,
		    input_ftime: ftime,
		    input_comment: comment
		});
		res.status(400).send(html);
	    }else{
		//投稿内容出力
		await shiftPut(username,date,stime,ftime,comment);
		let db = await dbConnect();
		if(req.body.skip_stime === 'true'){await db.execute('UPDATE shifts SET stime_ena = FALSE WHERE username = ? AND date = ? AND ena = TRUE',[username,date]);}
		if(req.body.skip_ftime === 'true'){await db.execute('UPDATE shifts SET ftime_ena = FALSE WHERE username = ? AND date = ? AND ena = TRUE',[username,date]);}
		await dbEnd(db);
		res.redirect('/');
	    }
	}else{
	    sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	}
    });
    
    //削除用
    app.post('/delete', async (req, res) => {
	//token確認
	if(await checkToken(req)){
	    //name取得
	    const cookies = parseCookies(req);
	    const username = cookies['name'];
	    const name_shift = req.body.username;
	    const date = req.body.date;
	    //shift削除
	    if(username == name_shift){
		await shiftDelete(username,date);	    
		res.redirect('/');
	    }else{
		sendError(res,'異なるユーザのシフトを削除しようとしています','/','ホーム画面');
	    }
	}else{
	    sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	}
    });
	     
    //編集画面表示
    app.get('/edit', async (req, res) => {
	if (await checkToken(req)) {
	    //name取得
	    const cookies = parseCookies(req);
	    const username = cookies['name']
	    const name_shift = req.query.username;
	    //shift削除
	    if(username == name_shift){
		const date = req.query.date;
		const stime = req.query.stime;
		const ftime = req.query.ftime;
		const comment = req.query.comment;
		const table = await getReadTable(username);
		const edit_html = await ejs.renderFile(`${__dirname}/webapp5_ejs/edit.ejs`, {
		    username:username,
		    date:date,
		    stime:stime,
		    ftime:ftime,
		    comment:comment,
		    table:table,
		    input_date: date,
		    input_stime: stime,
		    input_ftime: ftime,
		    input_comment: comment
		});
		res.send(edit_html);
	    }else{
		sendError(res,'異なるユーザのシフトを変更しようとしています','/','ホーム画面');
	    }
	}else{
	    sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	}	
    });
    
    //編集画面送信
    app.post('/edit', async (req, res) => {
	if (await checkToken(req)) {
	    const cookies = parseCookies(req);
	    const username = cookies['name'];
	    const pre_date = req.body.pre_date;
	    const pre_stime = req.body.pre_stime;
	    const pre_ftime = req.body.pre_ftime;
	    const pre_comment = req.body.pre_comment;
	    const new_date = req.body.new_date;
	    var new_stime = "00:00:00";
	    console.log(req.body.skip_new_stime,req.body.skip_new_ftime)
	    if(req.body.skip_new_stime === 'false'){new_stime = req.body.new_stime;}
	    var new_ftime = "23:59:00";
	    if(req.body.skip_new_ftime === 'false'){new_ftime = req.body.new_ftime;}
	    const new_comment = req.body.new_comment;
	    console.log('new_stime:', new_stime);
	    console.log('new_ftime:', new_ftime);
	    const sm = TtoM(new_stime);
	    const fm = TtoM(new_ftime);
	    const now = new Date();
	    const work_start = new Date(new_date + 'T' + new_stime);
	    const work_end = new Date(new_date + 'T' + new_ftime);
	    if (sm >= fm) {
		var error_text = '出社時刻は退社時刻よりも前である必要があります';
		const table = await getReadTable(username);
		const html = await ejs.renderFile(`${__dirname}/webapp5_ejs/edit.ejs`, {
		    username:username,
		    date:pre_date,
		    stime:pre_stime,
		    ftime:pre_ftime,
		    comment:pre_comment,
		    table:table,
		    error: error_text,
		    input_date: new_date,
		    input_stime: new_stime,
		    input_ftime: new_ftime,
		    input_comment: new_comment
		});
		res.status(400).send(html);
	    }else if (work_start < now && work_end < now) {
		var error_text = '過去の時刻は登録できません';
		const table = await getReadTable(username);
		const html = await ejs.renderFile(`${__dirname}/webapp5_ejs/edit.ejs`, {
		    username:username,
		    date:pre_date,
		    stime:pre_stime,
		    ftime:pre_ftime,
		    comment:pre_comment,
		    table:table,
		    error: error_text,
		    input_date: new_date,
		    input_stime: new_stime,
		    input_ftime: new_ftime,
		    input_comment: new_comment
		});
		res.status(400).send(html);
	    }else{
		//投稿内容出力
		await shiftPut(username,new_date,new_stime,new_ftime,new_comment);
		let db = await dbConnect();
		if(req.body.skip_new_stime === 'true'){await db.execute('UPDATE shifts SET stime_ena = FALSE WHERE username = ? AND date = ? AND ena = TRUE',[username,new_date]);}
		if(req.body.skip_new_ftime === 'true'){await db.execute('UPDATE shifts SET ftime_ena = FALSE WHERE username = ? AND date = ? AND ena = TRUE',[username,new_date]);}
		await dbEnd(db);
		res.redirect('/');
	    }
	} else {
            sendError(res, 'tokenの有効期限が切れています', '/login', 'ログイン画面');
	}
    });
    
    //ユーザー変更・ログイン画面表示
    app.get('/login', async (req, res) => {	
	//token確認
	if(await checkToken(req)){
	    //name取得
	    const cookies = parseCookies(req);
	    const username = cookies['name'];
	    //ユーザ変更画面HTML
	    const html_changeuser = await ejs.renderFile(`${__dirname}/webapp5_ejs/changeuser.ejs`, {
		username:username,
	    });
	    res.send(html_changeuser);
	}else{
	    //ログイン画面HTML
	    const html_login = await ejs.renderFile(`${__dirname}/webapp5_ejs/login.ejs`);
	    res.send(html_login);
	}
    });

    //ユーザー変更・ログイン画面送信
    app.post('/login', async (req, res) => {
	const name = req.body.name//名前
	const password = sha256(req.body.password);//ハッシュ化パスワード
	//名前とパスワード確認
	if(await checkPassword(name,password)){
	    //以前のサーバ側name+token削除
	    await tokenDelete(name)
	    //tokenの生成・保存
	    await tokenGenerateSave(name,res)
	    //ホームへ
	    res.redirect('/');
	}else{
	    //ログイン画面へ
	    sendError(res,'名前・パスワードの入力が間違っています','/login','ログイン画面');
	}
    });
	     
    //新規ユーザ登録画面表示
    app.get('/signup', async (req, res) => {	
	//token確認
	//if(await checkToken(req)){
	    // HTML
	    const html_signup = await ejs.renderFile(`${__dirname}/webapp5_ejs/signup.ejs`);
	    res.send(html_signup);
	//}else{
	    //sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	//}
    });
    
    
    //新規ユーザ登録画面から送信
    app.post('/signup' , async (req, res) => {
	//if(await checkToken(req)){
	    //名前・ハッシュ化パスワード・確認用ハッシュ化パスワード
	    const name = req.body.name
	    const password = sha256(req.body.password);
	    const check_password = sha256(req.body.checkpassword);
	    
	    //ユーザーのnameとpassword
	    const name_password = name+','+password
	    
	    //nameとpassword入力の確認
	    if(await checkName(name)==false && password == check_password){
		//nameとpasswordの保存
		await passwordInsert(name,password)
		//tokenの生成・保存
		await tokenGenerateSave(name,res)
		//ホームへ
		res.redirect('/');
	    }else if (await checkName(name)){
		sendError(res,'すでにその名前は使われています','/signup','ユーザ登録画面')
	    }else{
		sendError(res,'同じパスワードが入力されていません','/signup','ユーザ登録画面')
	    }
	//}else{
	    //ログイン画面へ
	    //sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	//}
    });
    
    //ログアウト
    app.get('/logout', async (req, res) => {
	const cookies = parseCookies(req);
	const name = cookies['name'];
	if (name) {
            await tokenDelete(name);
	}
	// cookie削除
	res.setHeader('Set-Cookie', [
            `name=; Max-Age=0; Path=/; HttpOnly`,
            `token=; Max-Age=0; Path=/; HttpOnly`
	]);
	//ログイン画面へ
	res.redirect('/login');
    });    
    app.listen(8822, () => {
	console.log('Server listening on port 8822');
    });
}
main();

