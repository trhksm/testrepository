#include <stdio.h>
#include <stdbool.h>
#include "../obj_loader.h"
#include "../rot_qua/rot_qua.h"
#include "../vector3.h"
#include <GL/glut.h>
#include <math.h>

void init() {
    glEnable(GL_DEPTH_TEST);
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    double rad_fovh = fovh * M_PI / 180.0d;
    double rad_fovv = fovv * M_PI / 180.0d;
    double aspect = tan(rad_fovh / 2.0d) / tan(rad_fovv / 2.0d);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(fovv, aspect, 1.0f, 100.0f);

    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    gluLookAt(eye[0], eye[1], eye[2],
    	      pov[0], pov[1], pov[2],
              up[0], up[1], up[2]);

    glColor3f(1.0f, 0.5f, 0.0f);
    glutSolidTeapot(1.0);
    glutSwapBuffers();
}

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
    //回転量用意
    double d_deg2[2] = {x - last_mouse_x, y - last_mouse_y};
    d_deg2[0] = d_deg2[0] * mul;d_deg2[1] = d_deg2[1] * mul;
    //回転実行upup
    rot(eye,axis_for_x,pov,d_deg2[0],eye);
    rot(eye,axis_for_y,pov,d_deg2[1],eye);
    rot(up,axis_for_y,pov,d_deg2[1],up);
}

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
    // upを補正
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
    glutPostRedisplay();
}

int main(int argc, char **argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);
    glutInitWindowSize(500, 500);
    glutCreateWindow("cg研修 - OpenGL 2.1");
    init();
    glutDisplayFunc(display);
    glutMouseFunc(mouse);
    glutMotionFunc(motion);
    glutMainLoop();
    return 0;
}
