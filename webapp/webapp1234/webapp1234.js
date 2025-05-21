const express = require('express');
const fs = require('fs')
const app = express();
const crypto = require('crypto')

app.use(express.urlencoded({ extended: true }));

//md5でハッシュ化
function md5hex(str /*: string */) {
    const md5 = crypto.createHash('md5')
    return md5.update(str, 'binary').digest('hex')
}

//時刻を分に換算
function TtoM(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

//トークンを制作
function generateToken(){
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456879'
    const tokenLength = 64;
    let token ='';
    for (let i = 0;i < tokenLength;i++){
	const randomIndex = Math.floor(Math.random()*characters.length);
	token += characters[randomIndex];
    }
    return token;
}
//cookie読み取り
function parsecookies(req){
    const list = {};
    const hcookie = req.headers.cookie;
    
    if (hcookie){
	hcookie.split(';').forEach(cookie => {
	    const parts = cookie.split('=');
	    const key = parts[0].trim();
	    const val = decodeURIComponent(parts[1]);
	    list[key] = val
	});
    }
    return list;
}
    
//token確認
function tokencheck(req){
    //cookie読み込み
    const cookies = parsecookies(req);
    //ユーザーのnameとtoken
    const name_token = cookies['name']+','+cookies['token']

    try {
        const data = fs.readFileSync('name_token.txt', 'utf8');
	//サーバー側のnameとtokenリスト
        const name_tokenlist = data.trim().split('\n');
	//リストにあるか
        return name_tokenlist.includes(name_token);
    } catch (err) {
        console.error('ファイル読み込みエラー:', err);
        return false;
    }
}
//--------------------------------
//ホーム表示
app.get('/', (req, res) => {
    //token確認
    if(tokencheck(req)){
	fs.readFile('data.txt', 'utf8', (err, data) => {
	    //読み込み確認
            if (err) {
		console.error('ファイル読み込みエラー:', err);
		return res.status(500).send('ファイルの読み込みに失敗しました');
            }
	    
	    //表形式に整形（HTML）
            let rows = data.trim().split('\n').map(line => {
		const [name, date, stime, ftime, comment] = line.split(',');
		return `<tr><td>${name}</td><td>${date}</td><td>${stime}</td><td>${ftime}</td><td>${comment}</td></tr>`;
            }).join('');
	    
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
  <h2>シフト投稿</h2>
  <form action="/" method="POST">
    <label>ユーザー名：
      <input type="text" name="name" required pattern="[a-z]+" title="小文字の英字のみを入力してください">
    </label><br>
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
    </label> <br><br>
    <button type="submit">送信</button>
  </form>
  <form action="/signup" method="GET">
    <button type="submit">ユーザー登録</button>
  </form>
  <form action="/logout" method="GET">
    <button type="submit">ログアウト</button>
  </form>
  <h1>出社予定</h1>
  <table border="1">
    <tr><th>ユーザー名</th><th>日付</th><th>出社</th><th>退社</th><th>コメント</th></tr>
    ${rows}
  </table>
</body>
</html>
`;
	    //画面表示
	    res.send(html);
	});
    }else{
	//ログイン画面へ
	res.redirect('/login');
    }
});

//ホームから送信
app.post('/', (req, res) => {
    //token確認
    if(tokencheck(req)){
	//受信確認用
	console.log('POSTリクエスト受信:', req.body);
	
	const name = req.body.name;//ユーザ名
	const date = req.body.date;//年月日
	const stime = req.body.stime;//出社時刻
	const ftime = req.body.ftime;//退社時刻
	const comment = req.body.comment;//コメント
	
	//入社時刻と退社時刻の確認
	const sm = TtoM(stime);
	const fm = TtoM(ftime);
	if (sm >= fm) {
	    return res.status(400).send('退社時刻は出社時刻より後である必要があります');
	}
	
	//投稿内容出力
	const text = name+','+date+','+stime+','+ftime+','+comment+'\n' ;
	console.log(text);
	fs.appendFile('data.txt', text, (err) => {
            if (err) {
		console.error('ファイル保存エラー:', err);
		res.status(500).send('保存に失敗しました');
            }
	});
	
	//ユーザリスト出力
	fs.readFile('username.txt', 'utf8', (err, data) => {
            if (err) {
		console.error('ファイル読み込みエラー:', err);
		return res.status(500).send('ファイルの読み込みに失敗しました');
            }
            let namelist = data.trim().split('\n');
	    if(namelist.includes(name)==false){
		fs.appendFile('username.txt', name + '\n', (err) => {
		    if (err) {
			console.error('ファイル保存エラー:', err);
			res.status(500).send('保存に失敗しました');
		    } 
		});
	    };
	});
	res.redirect('/');
    }else{
	res.redirect('/login');
    }
});



    
//ログイン画面表示
app.get('/login', (req, res) => {	
    //token確認
    if(tokencheck(req)){
	res.redirect('/');
    }else{
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
  <h2>ログイン</h2>
  <form action="/login" method="POST">
    <label>ユーザー名：
      <input type="text" name="name" required pattern="[a-z]+" title="小文字の英字のみを入力してください">
    </label><br>
    <label>パスワード：
      <input type="text" name="password" required pattern="[a-z]+" title="小文字の英字のみを入力してください">
    </label><br>
    <button type="submit">送信</button>
  </form>
</body>
</html>
`;
	res.send(html);
    }
});


//ログイン画面から送信
app.post('/login', (req, res) => {
    
    const name = req.body.name//名前
    const password = md5hex(req.body.password);//ハッシュ化パスワード

    //名前とパスワード確認
    fs.readFile('name_password.txt', 'utf8', (err, data) => {
	//読み込み確認用
        if (err) {
	    console.error('ファイル読み込みエラー:', err);
	    return res.status(500).send('ファイルの読み込みに失敗しました');
        }
	
	//サーバー側のnameとpasswordリスト
        let name_passwordlist = data.trim().split('\n');

	//ユーザーのnameとpassword
	const name_password = name+','+password
	
	if(name_passwordlist.includes(name_password)){
	    //トークンの生成
	    const token = generateToken();
	    
	    //cookieに保存
	    res.setHeader('Set-Cookie', [
		`name=${name}; Max-Age=3600; Path=/`,
		`token=${token}; Max-Age=3600; Path=/`
            ]);
	    //以前のサーバー側name+token削除
	    
	    //name+tokenサーバー側に保存
	    const name_token = name+','+token+'\n';//ユーザーのname+token 
	    fs.appendFile('name_token.txt', name_token, (err) => {
		if (err) {
		    console.error('ファイル保存エラー:', err);
		    res.status(500).send('保存に失敗しました');
		}
	    //ホームへ
		res.redirect('/');
	    });
	}else{
	    //ログイン画面へ
	    res.redirect('/login');
	}
    });
    
});

//ユーザ登録画面表示
app.get('/signup', (req, res) => {	
    //token確認
    if(tokencheck(req)){
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
  <h2>ユーザー登録</h2>
  <form action="/signup" method="POST">
    <label>新規ユーザー名：
      <input type="text" name="name" required pattern="[a-z]+" title="小文字の英字のみを入力してください">
    </label><br>
    <label>新規パスワード：
      <input type="text" name="password" required pattern="[a-z]+" title="小文字の英字のみを入力してください">
    </label><br>
    <label>確認用パスワード（同じパスワードを打ってください）：
      <input type="text" name="checkpassword" required pattern="[a-z]+" title="小文字の英字のみを入力してください">
    </label><br>
    <button type="submit">送信</button>
  </form>
  <form action="/" method="GET">
    <button type="submit">ホーム画面へ</button>
  </form>
</body>
</html>
`;
	res.send(html);
    }else{
	res.redirect('/login');
    }
});


//ユーザ登録画面から送信
app.post('/signup', (req, res) => {
    
    const name = req.body.name//名前
    const password = md5hex(req.body.password);//ハッシュ化パスワード
    const checkpassword = md5hex(req.body.checkpassword)//確認用ハッシュ化パスワード

    //名前とパスワード確認
    fs.readFile('name_password.txt', 'utf8', (err, data) => {
	//読み込み確認用
        if (err) {
	    console.error('ファイル読み込みエラー:', err);
	    return res.status(500).send('ファイルの読み込みに失敗しました');
        }
	
	//サーバー側のnameとpasswordリスト
        let name_passwordlist = data.trim().split('\n');

	//サーバー側のnameリスト
	let namelist = [];
	name_passwordlist.forEach((line) => {
	    namelist.push(line.split(',')[0])
	});
				  
	//ユーザーのnameとpassword
	const name_password = name+','+password

	//nameとpasswordの確認
	if(namelist.includes(name)==false && password == checkpassword){
	    //nameとpasswordの保存
	    fs.appendFile('name_password.txt', name_password, (err) => {
		if (err) {
		    console.error('ファイル保存エラー:', err);
		    res.status(500).send('保存に失敗しました');
		}
	    });
	    
	    //トークンの生成
	    const token = generateToken();
	    
	    //cookieに保存
	    res.setHeader('Set-Cookie', [
		`name=${name}; Max-Age=3600; Path=/`,
		`token=${token}; Max-Age=3600; Path=/`
            ]);
	    //以前のサーバー側name+token削除
	    
	    //name+tokenサーバー側に保存
	    const name_token = name+','+token+'\n';//ユーザーのname+token 
	    fs.appendFile('name_token.txt', name_token, (err) => {
		if (err) {
		    console.error('ファイル保存エラー:', err);
		    res.status(500).send('保存に失敗しました');
		}
	    //ホームへ
		res.redirect('/');
	    });
	}else{
	    //ログイン画面へ
	    res.redirect('/login');
	}
    });
});
//ログアウト
app.get('/logout', async (req, res) => {
    const cookies = parsecookies(req);
    const name = cookies['name'];
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
