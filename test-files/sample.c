
/**
 * Binary Search Tree implementation in C
 */
#include <stdio.h>
#include <stdlib.h>

// Node structure for the BST
typedef struct Node {
    int data;
    struct Node* left;
    struct Node* right;
} Node;

// Create a new node
Node* createNode(int value) {
    Node* newNode = (Node*)malloc(sizeof(Node));
    newNode->data = value;
    newNode->left = NULL;
    newNode->right = NULL;
    return newNode;
}

// Insert a value into the BST
Node* insert(Node* root, int value) {
    if (root == NULL) {
        return createNode(value);
    }
    
    if (value < root->data) {
        root->left = insert(root->left, value);
    } else if (value > root->data) {
        root->right = insert(root->right, value);
    }
    
    return root;
}

// Search for a value in the BST
Node* search(Node* root, int value) {
    if (root == NULL || root->data == value) {
        return root;
    }
    
    if (value < root->data) {
        return search(root->left, value);
    }
    
    return search(root->right, value);
}

// Print the BST in-order
void inorderTraversal(Node* root) {
    if (root == NULL) {
        return;
    }
    
    inorderTraversal(root->left);
    printf("%d ", root->data);
    inorderTraversal(root->right);
}

// Free the memory used by the BST
void freeTree(Node* root) {
    if (root == NULL) {
        return;
    }
    
    freeTree(root->left);
    freeTree(root->right);
    free(root);
}

int main() {
    Node* root = NULL;
    
    // Insert some values
    root = insert(root, 50);
    insert(root, 30);
    insert(root, 70);
    insert(root, 20);
    insert(root, 40);
    insert(root, 60);
    insert(root, 80);
    
    // Print the tree in-order
    printf("BST in-order traversal: ");
    inorderTraversal(root);
    printf("\n");
    
    // Search for a value
    int searchValue = 40;
    Node* result = search(root, searchValue);
    if (result != NULL) {
        printf("Value %d found in the BST.\n", searchValue);
    } else {
        printf("Value %d not found in the BST.\n", searchValue);
    }
    
    // Free the memory
    freeTree(root);
    
    return 0;
}
