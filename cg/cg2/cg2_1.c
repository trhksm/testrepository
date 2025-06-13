#include <GL/glut.h>
#include <math.h>

void init() {
    glEnable(GL_DEPTH_TEST);
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    float eye[3] = {5.0f, 5.0f, 5.0f};
    float pov[3] = {0.0f, 0.0f, 0.0f};
    float up[3]  = {0.0f, 1.0f, 0.0f};

    float fovh = 60.0f;
    float fovv = 45.0f;

    float rad_fovh = fovh * M_PI / 180.0f;
    float rad_fovv = fovv * M_PI / 180.0f;

    float aspect = tan(rad_fovh / 2.0f) / tan(rad_fovv / 2.0f);

    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(fovv, aspect, 1.0f, 100.0f);

    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    gluLookAt(eye[0], eye[1], eye[2],
    	      pov[0], pov[1], pov[2],
              up[0], up[1], up[2]);

    glColor3f(1.0f, 0.0f, 1.0f);
    glutSolidCube(2.0);

    glutSwapBuffers();
}

int main(int argc, char **argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);
    glutInitWindowSize(500, 500);
    glutCreateWindow("cg研修 - OpenGL 2.1");

    init();
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}

