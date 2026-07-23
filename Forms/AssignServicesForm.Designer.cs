namespace MFC_Youth_Database.Forms
{
    partial class AssignServicesForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.lblTitle = new System.Windows.Forms.Label();
            this.lblMember = new System.Windows.Forms.Label();
            this.txtMemberName = new System.Windows.Forms.TextBox();
            this.lblServices = new System.Windows.Forms.Label();
            this.clbServices = new System.Windows.Forms.CheckedListBox();
            this.btnSave = new System.Windows.Forms.Button();
            this.btnCancel = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // lblTitle
            // 
            this.lblTitle.AutoSize = true;
            this.lblTitle.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.lblTitle.Font = new System.Drawing.Font("Segoe UI", 20.25F, System.Drawing.FontStyle.Bold);
            this.lblTitle.Location = new System.Drawing.Point(12, 26);
            this.lblTitle.Name = "lblTitle";
            this.lblTitle.Size = new System.Drawing.Size(242, 37);
            this.lblTitle.TabIndex = 0;
            this.lblTitle.Text = "ASSIGN SERVICES";
            // 
            // lblMember
            // 
            this.lblMember.AutoSize = true;
            this.lblMember.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.lblMember.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.lblMember.Location = new System.Drawing.Point(15, 78);
            this.lblMember.Name = "lblMember";
            this.lblMember.Size = new System.Drawing.Size(68, 19);
            this.lblMember.TabIndex = 1;
            this.lblMember.Text = "Member: ";
            // 
            // txtMemberName
            // 
            this.txtMemberName.Location = new System.Drawing.Point(19, 100);
            this.txtMemberName.Name = "txtMemberName";
            this.txtMemberName.ReadOnly = true;
            this.txtMemberName.Size = new System.Drawing.Size(235, 20);
            this.txtMemberName.TabIndex = 2;
            // 
            // lblServices
            // 
            this.lblServices.AutoSize = true;
            this.lblServices.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.lblServices.Location = new System.Drawing.Point(19, 135);
            this.lblServices.Name = "lblServices";
            this.lblServices.Size = new System.Drawing.Size(64, 19);
            this.lblServices.TabIndex = 3;
            this.lblServices.Text = "Services: ";
            // 
            // clbServices
            // 
            this.clbServices.CheckOnClick = true;
            this.clbServices.FormattingEnabled = true;
            this.clbServices.Location = new System.Drawing.Point(19, 157);
            this.clbServices.Name = "clbServices";
            this.clbServices.Size = new System.Drawing.Size(235, 274);
            this.clbServices.TabIndex = 4;
            this.clbServices.ItemCheck += new System.Windows.Forms.ItemCheckEventHandler(this.clbServices_ItemCheck);
            // 
            // btnSave
            // 
            this.btnSave.Location = new System.Drawing.Point(265, 182);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(75, 23);
            this.btnSave.TabIndex = 5;
            this.btnSave.Text = "Save";
            this.btnSave.UseVisualStyleBackColor = true;
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);
            // 
            // btnCancel
            // 
            this.btnCancel.Location = new System.Drawing.Point(265, 211);
            this.btnCancel.Name = "btnCancel";
            this.btnCancel.Size = new System.Drawing.Size(75, 23);
            this.btnCancel.TabIndex = 6;
            this.btnCancel.Text = "Cancel";
            this.btnCancel.UseVisualStyleBackColor = true;
            this.btnCancel.Click += new System.EventHandler(this.btnCancel_Click);
            // 
            // AssignServicesForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(361, 450);
            this.Controls.Add(this.btnCancel);
            this.Controls.Add(this.btnSave);
            this.Controls.Add(this.clbServices);
            this.Controls.Add(this.lblServices);
            this.Controls.Add(this.txtMemberName);
            this.Controls.Add(this.lblMember);
            this.Controls.Add(this.lblTitle);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.KeyPreview = true;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "AssignServicesForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
            this.Text = "Assign Services";
            this.KeyDown += new System.Windows.Forms.KeyEventHandler(this.AssignServicesForm_KeyDown);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label lblTitle;
        private System.Windows.Forms.Label lblMember;
        private System.Windows.Forms.TextBox txtMemberName;
        private System.Windows.Forms.Label lblServices;
        private System.Windows.Forms.CheckedListBox clbServices;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Button btnCancel;
    }
}