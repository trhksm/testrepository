#include <stdio.h>
#include <stdbool.h>
#include "../obj_loader_nv.h"
#include "../rot_qua/rot_qua.h"
#include "../vector3.h"
#include <GL/glut.h>
#include <math.h>

float light[4];
float green[4] = { 0.0, 1.0, 0.0, 1.0 };//変更箇所　光源の色
float offset_up = 0.5f;//変更箇所　視点と光源の距離

void init() {
    glEnable(GL_DEPTH_TEST);//深度バッファで奥行き管理
    glEnable(GL_LIGHTING);//光源による照明効果有効化
    glEnable(GL_LIGHT0);//光源０有効化
    glLightfv(GL_LIGHT0, GL_DIFFUSE, green);//光源０拡散光色付け
    glLightfv(GL_LIGHT0, GL_SPECULAR, green);//光源０反射光色付け
    glEnable(GL_COLOR_MATERIAL);//glColorMaterial有効化
    glColorMaterial(GL_FRONT, GL_AMBIENT_AND_DIFFUSE);//glColor()を材質の環境光と拡散光に適用
    glShadeModel(GL_SMOOTH);//ポリゴン頂点の色や光の補間
    glEnable(GL_NORMALIZE);//法線ベクトルを正規化（自動）
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);//色バッファと深度バッファをクリア
    double rad_fovh = fovh * M_PI / 180.0d;//水平視野角
    double rad_fovv = fovv * M_PI / 180.0d;//垂直視野角
    double aspect = tan(rad_fovh / 2.0d) / tan(rad_fovv / 2.0d);//アスペクト比

    glMatrixMode(GL_PROJECTION);//投影行列モード
    glLoadIdentity();//リセット
    gluPerspective(fovv, aspect, 0.01f, 100.0f);//視野角・アスペクト比・近遠クリップ面

    glMatrixMode(GL_MODELVIEW);//モデルビュー行列モード
    glLoadIdentity();//リセット
    gluLookAt(eye[0], eye[1], eye[2],
    	      pov[0], pov[1], pov[2],
              up[0], up[1], up[2]);//視点設定

    // 光源位置を視点の上固定
    for (int i = 0; i < 3; i++) {
        light[i] = eye[i] + offset_up * up[i];
    }
    light[3] = 1.0f;//位置的光源
    glLightfv(GL_LIGHT0, GL_POSITION, light);//光源０位置設定
    
    //ポリゴンの三角形頂点・法線指定
    for (int i=0;i<f_count;i++){
        glColor3f(1.0f,1.0f,0.0f);//色設定
        glBegin(GL_TRIANGLES);
        glNormal3f(vn[f[i].v1 - 1].x, vn[f[i].v1 - 1].y, vn[f[i].v1 - 1].z);
        glVertex3f(v[f[i].v1 - 1].x, v[f[i].v1 - 1].y, v[f[i].v1 - 1].z);
        glNormal3f(vn[f[i].v2 - 1].x, vn[f[i].v2 - 1].y, vn[f[i].v2 - 1].z);
        glVertex3f(v[f[i].v2 - 1].x, v[f[i].v2 - 1].y, v[f[i].v2 - 1].z);
        glNormal3f(vn[f[i].v3 - 1].x, vn[f[i].v3 - 1].y, vn[f[i].v3 - 1].z);
        glVertex3f(v[f[i].v3 - 1].x, v[f[i].v3 - 1].y, v[f[i].v3 - 1].z);
        glEnd();
    }
    glutSwapBuffers();//バックとフロントバッファの入れ替え
}
//平行移動
void parallel(int x,int y){
    double mul = 0.001d;//変換倍率(1000px=>1.0)
    //水平・垂直単位ベクトル用意
    double pov_to_eye[3];
    double axis_x[3];
    double axis_y[3];
    for(int i = 0; i < 3; i++){axis_y[i] = up[i];}
    v3sub(eye,pov,pov_to_eye);
    v3nom(pov_to_eye,pov_to_eye);
    v3crs(up,pov_to_eye,axis_x);
    //移動変位ベクトル用意
    double d_v3[3];
    double d_v2[2] = {x - last_mouse_x, y - last_mouse_y};
    v3mul(mul*d_v2[0]*(-1),axis_x,axis_x);
    v3mul(mul*d_v2[1],axis_y,axis_y);
    v3add(axis_x,axis_y,d_v3);
    //移動実行
    v3add(eye,d_v3,eye);
    v3add(pov,d_v3,pov);
}
//回転
void rotate(int x, int y){
    double mul = 0.009d;//変換倍率(1000px=>9deg)
    //回転軸用意
    double pov_to_eye[3];
    double axis_for_x[3];
    for(int i = 0; i < 3; i++){axis_for_x[i] = up[i];}
    double axis_for_y[3];
    v3sub(eye,pov,pov_to_eye);
    v3nom(pov_to_eye,pov_to_eye);
    v3crs(up,pov_to_eye,axis_for_y);
    v3nom(axis_for_y,axis_for_y);
    //回転量用意
    double d_deg2[2] = {x - last_mouse_x, y - last_mouse_y};
    d_deg2[0] = d_deg2[0] * mul;d_deg2[1] = d_deg2[1] * mul;
    //回転実行
    rot(eye,axis_for_x,pov,d_deg2[0],eye);
    rot(eye,axis_for_y,pov,d_deg2[1],eye);
    rot(up,axis_for_y,pov,d_deg2[1],up);
}
//ズーム
void zoom(int x,int y){
    double mul = 0.001d;//変換倍率(1000px=>1.0)
    //注視点から視点方向単位ベクトル用意
    double pov_to_eye[3];
    v3sub(eye,pov,pov_to_eye);
    v3nom(pov_to_eye,pov_to_eye);
    //移動変位ベクトル用意
    double d_x = x - last_mouse_x;
    double d = mul * d_x;
    double d_v3[3];
    v3mul(d,pov_to_eye,d_v3);
    //ズーム実行
    v3add(eye,d_v3,eye);
}
//クリック時関数
void mouse(int button, int state, int x, int y){
    if(state == GLUT_DOWN){
    last_mouse_x = x;last_mouse_y = y;
        if(button == GLUT_LEFT_BUTTON){
        button_state = 0;//left
        }else if(button == GLUT_RIGHT_BUTTON){
        button_state = 1;//right
        }else if(button == GLUT_MIDDLE_BUTTON){
        button_state = 2;//middle
        }
    }
}

void motion(int x, int y){
    // upを補正（不審な挙動対策で追加）
    double pov_to_eye[3];
    v3sub(eye, pov, pov_to_eye);
    v3nom(pov_to_eye, pov_to_eye);
    // 新しい axis_y を up とする（視線に直交させる）
    double axis_x[3];
    v3crs(up, pov_to_eye, axis_x);
    v3nom(axis_x, axis_x);
    // 新しい up を再計算し保存
    v3crs(pov_to_eye, axis_x, up);
    v3nom(up, up);
    
    if(button_state == 0){parallel(x,y);}
    else if(button_state == 1){rotate(x,y);}
    else if(button_state == 2){zoom(x,y);}
    last_mouse_x = x;last_mouse_y = y;
    glutPostRedisplay();//再描写要求
}

int main(int argc, char **argv) {
    if (load_obj("bunny2.obj") != 0) {
        fprintf(stderr, "OBJファイルの読み込みに失敗しました。\n");
        return 1;
    }
    glutInit(&argc, argv);//GLUTの初期化
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);//表示モードの設定
    glutInitWindowSize(500, 500);//ウィンドウの初期サイズ
    glutCreateWindow("cg研修 - OpenGL 2.1");//ウィンドウの作成とタイトル設定
    init();//OpenGL状態を初期化
    glutDisplayFunc(display);
    glutMouseFunc(mouse);
    glutMotionFunc(motion);
    glutMainLoop();//イベンドループの開始
    return 0;
}
