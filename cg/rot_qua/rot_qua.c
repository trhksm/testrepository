// 四元数で任意軸回転
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

//基本
// q = a + bi + cj + dk
// ii = jj = kk = -1
// ij=+k , jk=+i, ki=+j
// ji=-k , kj=-i, ik=-j
// |q|=sqrt( a^2 + b^2 + c^2 + d^2)   ノルム
// q.bar = a - bi - cj - dk           共役
// qq^(-1)=1, q^(-1) = q.bar/(|q|^2)  逆元
// q1(q2q3)=(q1q2)q3                  交換則
// (q1q2).bar = q1.bar q2.bar
//
//回転
// u = (ux,uy,uz) = ux i + uy j + uz k が方向ベクトル（|u|=1）
// a = (ax,ay,az) = ax i + ay j + az k が回転させる位置ベクタ（任意）
// q = cos(θ/2) +  u sin(θ/2) として
// b = (bx,by,bz) = bx i + by j + bz k = q a q.bar が回転後のベクタ
//

typedef struct{
    double a;
    double b;//i成分
    double c;//j成分
    double d;//k成分
} Qua;

void showq(Qua v){
    printf("%+8.3f    %+8.3f %+8.3f %+8.3f \n",v.a,v.b,v.c,v.d);
}

Qua qua_add(Qua q1,Qua q2){
    Qua ret;
    ret.a = q1.a + q2.a;
    ret.b = q1.b + q2.b;
    ret.c = q1.c + q2.c;
    ret.d = q1.d + q2.d;
    return ret;
}
Qua bar(Qua q){
    Qua ret;
    ret.a =  q.a;
    ret.b = -q.b;
    ret.c = -q.c;
    ret.d = -q.d;
    return ret;
}
Qua qua_mul(Qua q1,Qua q2){
    Qua ret;
    double a1=q1.a;     double a2=q2.a;
    double b1=q1.b;     double b2=q2.b;
    double c1=q1.c;     double c2=q2.c;
    double d1=q1.d;     double d2=q2.d;
    ret.a = a1*a2 - b1*b2 - c1*c2 - d1*d2;// 1成分
    ret.b = b1*a2 + a1*b2 - d1*c2 + c1*d2;// i成分
    ret.c = c1*a2 + d1*b2 + a1*c2 - b1*d2;// j成分
    ret.d = d1*a2 - c1*b2 + b1*c2 + a1*d2;// k成分
    return ret;  
}
double norm(Qua q){
    double a=q.a;
    double b=q.b;
    double c=q.c;
    double d=q.d;
    return sqrt(a*a+b*b+c*c+d*d);
}
Qua normalize(Qua q){
    double n = norm(q);
    if(n<1e-10){ puts("Error: normalize()  norm is almost 0"); exit(-1); }
    double inv = 1.0/n;
    q.a *= inv;    q.b *= inv;    q.c *= inv;    q.d *= inv;
    return q;
}
Qua getq(double rad, Qua u){
    Qua ret;
    ret.a = cos(rad/2);
    ret.b = sin(rad/2)*u.b;
    ret.c = sin(rad/2)*u.c;
    ret.d = sin(rad/2)*u.d;
    return ret;
}

//原点を通る任意軸回転
void rot0(double *p0, double *axis, double rad, double *p1){// u:回転軸の方向ベクタ
    Qua u,src;
    u.a  =0;   u.b  =axis[0]; u.c  =axis[1]; u.d  =axis[2];
    src.a=0;   src.b=p0[0];   src.c=p0[1];   src.d=p0[2];
    u = normalize(u);
    Qua q   = getq(rad,u);
    Qua qa  = qua_mul(q,src);
    Qua dst = qua_mul(qa,bar(q));
    p1[0]=dst.b;
    p1[1]=dst.c;
    p1[2]=dst.d;
}

//任意軸回転
void rot(double *p0, double *axis, double *ofs, double rad, double *p1){
    // ofsを原点に並行移動してから回転し、その後にもどす
    double org[3];    org[0]=p0[0];    org[1]=p0[1];     org[2]=p0[2]; 
    //平行移動（往路）
    org[0]-=ofs[0];   org[1]-=ofs[1];   org[2]-=ofs[2];
    //原点を通る軸で回転
    rot0(org,axis,rad, p1);
    //平行移動（復路）
    p1[0]+=ofs[0];    p1[1]+=ofs[1];    p1[2]+=ofs[2];
}
