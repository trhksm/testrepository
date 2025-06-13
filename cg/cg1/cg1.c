#include <GL/glut.h>

void display() {
    glClear(GL_COLOR_BUFFER_BIT);

    // シアンの三角形
    glColor3f(0.0f, 1.0f, 1.0f);
    glBegin(GL_TRIANGLES);
        glVertex2f(-0.8f, -0.5f);
        glVertex2f(-0.2f, -0.5f);
        glVertex2f(-0.5f,  0.3f);
    glEnd();

    // 黄色の正方形
    glColor3f(1.0f, 1.0f, 0.0f);
    glBegin(GL_QUADS);
        glVertex2f(0.2f, -0.3f);
        glVertex2f(0.6f, -0.3f);
        glVertex2f(0.6f,  0.1f);
        glVertex2f(0.2f,  0.1f);
    glEnd();

    glFlush();
}

void init() {
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(-1.0, 1.0, -1.0, 1.0); // 描画範囲
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(500, 500);
    glutCreateWindow("cg研修 - OpenGL 2.1");
    init();
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}