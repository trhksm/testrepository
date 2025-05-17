const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const crypto = require('crypto')
const mysql = require('mysql2/promise');
//接続
async function dbConnect(){
    let db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'mysql_pass',
        database: 'shift_system'
    });
    return db;
}

//接続終了
async function dbEnd(db){
    if (db) {
        await db.end();
    }
}

//shifts追加&更新
async function shiftPut(u,d,s,f,c){
    let db = await dbConnect();
    const [rows] = await db.execute('SELECT id FROM shifts WHERE username = ? AND date = ? AND ena = TRUE', [u, d]);
    if (rows.length > 0) {
	await db.execute('UPDATE shifts SET ena = FALSE WHERE username = ? AND date = ?',[s,f,c,u,d]);
    }
    await db.execute('INSERT shifts (username, date, stime, ftime, comment) VALUES (?,?,?,?,?)',[u,d,s,f,c]);
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
    await db.execute('INSERT INTO users_tokens (username, token) VALUES (?, ?)',[u,t]);
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
    await db.execute('DELETE FROM users_tokens WHERE username = ?', [u]);
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
    //cookie読み込み
    const cookies = parseCookies(req);
    //ユーザのnameとtoken
    const name_token = cookies['name']+','+cookies['token']
    //サーバ側のnameとtokenリストにあるか
    const data = await tableSelect('users_tokens')
    const name_tokenlist = data.map(row => row.username + ',' + row.token);
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

function sendError(res, message, link ,place) {
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>エラー</title></head>
  <body>
    <h1>エラー</h1>
    <p>${message}</p>
    <form action="${link}" method="GET">
      <button type="submit" style="font-size: 18px; padding: 10px 20px; width: 30%;">${place}へ戻る</button>
    </form>
  </body>
</html>`;
    res.status(400).send(html);
}

async function main(){
    //ホーム画面表示
    app.get('/', async (req, res) => {
	//token確認
	if(await checkToken(req)){
	    //name取得
	    const cookies = parseCookies(req);
	    const name = cookies['name'];
	    //シフト読み込み
	    const db = await dbConnect();
	    const [data] = await db.query(`SELECT username, DATE_FORMAT(date, '%Y-%m-%d') as date, stime, ftime, comment FROM shifts WHERE ena = TRUE ORDER BY date, CASE WHEN username = ? THEN 1 ELSE 2 END`, [name]);
	    //シフト表示形式用整理
	    let rows = data.map(row => {
		// 出社・退社時刻をHH:MMだけに
		const stimeHM = row.stime ? row.stime.substring(0, 5) : '';
		const ftimeHM = row.ftime ? row.ftime.substring(0, 5) : '';	
		return `<tr>
    <td>${row.username}</td>
    <td>${row.date}</td>
    <td>${stimeHM}</td>
    <td>${ftimeHM}</td>
    <td>${row.comment}</td>
  </tr>`;
	    }).join('');
	    dbEnd();
	    
	    // HTML
	    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Webapp研修</title>
</head>
<body>
  <h1>シフト管理システム</h1>
  <h4>あなたは${name}さんとしてログインしています</h4>
  <div style="display: flex; gap: 50px; align-items: flex-start;">
    <form action="/" method="POST">
      <h2>シフト投稿・更新</h2>
      <label>年月日：
        <input type="date" name="date" required>
      </label><br>
      <label>出社時刻：
        <input type="time" name="stime" required>
      </label><br>
      <label>退社時刻：
        <input type="time" name="ftime" required>
      </label><br>
      <label>コメント：
        <input type="text" name="comment">
      </label><br><br>
      <button type="submit" style="font-size: 18px; padding: 10px 20px; width: 100%;">送信（シフト投稿・更新）</button>
    </form>
    <form action="/delete" method="POST">
      <h2>シフト削除</h2>
      <label>年月日：
        <input type="date" name="date" required>
      </label><br><br>
      <button type="submit" style="font-size: 18px; padding: 10px 20px; width: 100%;">送信（シフト削除）</button>
    </form>
  </div>
  <h2>出社予定</h2>
  <table border="1">
    <tr><th>ユーザ名</th><th>日付</th><th>出社</th><th>退社</th><th>コメント</th></tr>
    ${rows}
  </table>
  <div style="display: flex; gap: 50px; align-items: flex-start;">
    <form action="/signup" method="GET">
    <h2>新規ユーザ登録</h2>
      <button type="submit" style="font-size: 18px; padding: 10px 20px; width: 100%;">新規ユーザ登録画面へ</button>
    </form>
    <form action="/logout" method="GET">
    <h2>ログアウト</h2>
      <button type="submit" style="font-size: 18px; padding: 10px 20px; width: 100%;">ログアウト（ログイン画面へ）</button>
    </form>
  </div>
</body>
</html>
`;
	    //画面表示
	    res.send(html);
	}else{
	    //ログイン画面へ
	    sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	}
    });
    
    //ホームから送信
    app.post('/', async (req, res) => {
	//token確認
	if(await checkToken(req)){
	    //name取得
	    const cookies = parseCookies(req);
	    const name = cookies['name'];
	    
	    const date = req.body.date;//年月日
	    const stime = req.body.stime;//出社時刻
	    const ftime = req.body.ftime;//退社時刻
	    const comment = req.body.comment;//コメント
	    
	    //入社時刻と退社時刻の確認
	    const sm = TtoM(stime);
	    const fm = TtoM(ftime);
	    if (sm >= fm) {
		sendError(res,'入社時刻は退社時刻よりも前である必要があります','/','ホーム画面');
	    }else{
		//投稿内容出力
		await shiftPut(name,date,stime,ftime,comment);	    
		res.redirect('/');
	    }
	}else{
	    sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	}
    });
    
    //ホームから送信(delette用)
    app.post('/delete', async (req, res) => {
	//token確認
	if(await checkToken(req)){
	    //name取得
	    const cookies = parseCookies(req);
	    const name = cookies['name'];
	    
	    const date = req.body.date;//年月日
	    //shift削除
	    await shiftDelete(name,date);	    
	    res.redirect('/');
	}else{
	    sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	}
    });
    
    
    
    
    //ログイン画面表示
    app.get('/login', async (req, res) => {	
	//token確認
	if(await checkToken(req)){
	    //name取得
	    const cookies = parseCookies(req);
	    const name = cookies['name'];
	    //ユーザ変更画面HTML
	    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Webapp研修＿ログイン画面</title>
</head>
<body>
  <h1>シフト管理システム</h1>
  <h2>ユーザー変更(あなたは${name}さんとしてログインしています)</h2>
  <form action="/login" method="POST">
    <label>ユーザー名：
      <input type="text" name="name" required pattern="[a-z]+" title="小文字英字">
    </label><br>
    <label>パスワード：
      <input type="password" name="password" required pattern="[a-z]+" title="小文字英字または数字">
    </label><br>
    <button type="submit" style="font-size: 18px; padding: 10px 20px; width: 30%;">送信</button>
  </form>
</body>
</html>
`;
	    res.send(html);
	}else{
	    //ログイン画面HTML
	    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Webapp研修＿ログイン画面</title>
</head>
<body>
  <h1>シフト管理システム</h1>
  <h2>ログイン</h2>
  <form action="/login" method="POST">
    <label>ユーザー名：
      <input type="text" name="name" required pattern="[a-z]+" title="小文字英字">
    </label><br>
    <label>パスワード：
      <input type="password" name="password" required pattern="[a-z0-9]+" title="小文字英字または数字">
    </label><br>
    <button type="submit" style="font-size: 18px; padding: 10px 20px; width: 30%;">送信</button>
  </form>
</body>
</html>
`;
	    res.send(html);
	}
    });
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
	if(await checkToken(req)){
	    // HTML
	    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Webapp研修＿ログイン画面</title>
</head>
<body>
  <h1>シフト管理システム</h1>
  <h2>新規ユーザ登録</h2>
  <form action="/signup" method="POST">
    <label>新規ユーザ名：
      <input type="text" name="name" required pattern="[a-z]+" title="小文字英字">
    </label><br>
    <label>新規パスワード：
      <input type="password" name="password" required pattern="[a-z0-9]+" title="小文字英字または数字">
    </label><br>
    <label>確認用パスワード（同じパスワードを打ってください）：
      <input type="text" name="checkpassword" required pattern="[a-z0-9]+" title="小文字英字または数字">
    </label><br>
    <button type="submit" style="font-size: 18px; padding: 10px 20px; width: 30%;">送信</button>
  </form>
  <form action="/" method="GET">
  <h2>ホーム画面に戻る</h2>
    <button type="submit" style="font-size: 18px; padding: 10px 20px; width: 30%;">ホーム画面へ</button>
  </form>
</body>
</html>
`;
	    res.send(html);
	}else{
	    sendError(res,'tokenの有効期限が切れています','/login','ログイン画面')
	}
    });
    
    
    //新規ユーザ登録画面から送信
    app.post('/signup' , async (req, res) => {
	if(await checkToken(req)){
	    const name = req.body.name//名前
	    const password = sha256(req.body.password);//ハッシュ化パスワード
	    const check_password = sha256(req.body.checkpassword)//確認用ハッシュ化パスワード
	    
	    //ユーザーのnameとpassword
	    const name_password = name+','+password
	    
	    //nameと同一passwordの確認
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
	}else{
	    //ログイン画面へ
	    sendError(res,'tokenの有効期限が切れています','/login','ログイン画面');
	}
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
