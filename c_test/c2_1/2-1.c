#include<stdio.h>
int main(void) {
    int fn[11] = { 0, 1};//初期条件
    printf("%d\n",fn[0]);
    printf("%d\n",fn[1]);
    for(int i = 2; i <= 10; i++){
        fn[i] = fn[i-1] + fn[i-2];//fibonacci数列
        printf("%d\n",fn[i]);
    }
    return 0;
}
