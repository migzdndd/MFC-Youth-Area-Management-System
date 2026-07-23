namespace MFC_Youth_Area_Management_System.Forms
{
    partial class UpdateAvailableForm
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
            this.lblCurrentVersion = new System.Windows.Forms.Label();
            this.lblCurrentVersionValue = new System.Windows.Forms.Label();
            this.lblLatestVersion = new System.Windows.Forms.Label();
            this.lblLatestVersionValue = new System.Windows.Forms.Label();
            this.lblReleaseNotes = new System.Windows.Forms.Label();
            this.rtbReleaseNotes = new System.Windows.Forms.RichTextBox();
            this.btnLater = new System.Windows.Forms.Button();
            this.btnUpdateNow = new System.Windows.Forms.Button();
            this.lblTitle = new System.Windows.Forms.Label();
            this.lblDescription = new System.Windows.Forms.Label();
            this.lblStatus = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // lblCurrentVersion
            // 
            this.lblCurrentVersion.AutoSize = true;
            this.lblCurrentVersion.Font = new System.Drawing.Font("Segoe UI", 10F, System.Drawing.FontStyle.Bold);
            this.lblCurrentVersion.Location = new System.Drawing.Point(20, 120);
            this.lblCurrentVersion.Name = "lblCurrentVersion";
            this.lblCurrentVersion.Size = new System.Drawing.Size(116, 19);
            this.lblCurrentVersion.TabIndex = 0;
            this.lblCurrentVersion.Text = "Current Version:";
            // 
            // lblCurrentVersionValue
            // 
            this.lblCurrentVersionValue.AutoSize = true;
            this.lblCurrentVersionValue.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.lblCurrentVersionValue.Location = new System.Drawing.Point(170, 120);
            this.lblCurrentVersionValue.Name = "lblCurrentVersionValue";
            this.lblCurrentVersionValue.Size = new System.Drawing.Size(39, 19);
            this.lblCurrentVersionValue.TabIndex = 1;
            this.lblCurrentVersionValue.Text = "1.0.0";
            // 
            // lblLatestVersion
            // 
            this.lblLatestVersion.AutoSize = true;
            this.lblLatestVersion.Font = new System.Drawing.Font("Segoe UI", 10F, System.Drawing.FontStyle.Bold);
            this.lblLatestVersion.Location = new System.Drawing.Point(20, 150);
            this.lblLatestVersion.Name = "lblLatestVersion";
            this.lblLatestVersion.Size = new System.Drawing.Size(105, 19);
            this.lblLatestVersion.TabIndex = 2;
            this.lblLatestVersion.Text = "Latest Version:";
            // 
            // lblLatestVersionValue
            // 
            this.lblLatestVersionValue.AutoSize = true;
            this.lblLatestVersionValue.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.lblLatestVersionValue.Location = new System.Drawing.Point(170, 150);
            this.lblLatestVersionValue.Name = "lblLatestVersionValue";
            this.lblLatestVersionValue.Size = new System.Drawing.Size(39, 19);
            this.lblLatestVersionValue.TabIndex = 3;
            this.lblLatestVersionValue.Text = "1.0.1";
            // 
            // lblReleaseNotes
            // 
            this.lblReleaseNotes.AutoSize = true;
            this.lblReleaseNotes.Font = new System.Drawing.Font("Segoe UI", 11F, System.Drawing.FontStyle.Bold);
            this.lblReleaseNotes.Location = new System.Drawing.Point(20, 190);
            this.lblReleaseNotes.Name = "lblReleaseNotes";
            this.lblReleaseNotes.Size = new System.Drawing.Size(108, 20);
            this.lblReleaseNotes.TabIndex = 4;
            this.lblReleaseNotes.Text = "Release Notes";
            // 
            // rtbReleaseNotes
            // 
            this.rtbReleaseNotes.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.rtbReleaseNotes.Font = new System.Drawing.Font("Segoe UI", 9.75F);
            this.rtbReleaseNotes.Location = new System.Drawing.Point(20, 220);
            this.rtbReleaseNotes.Name = "rtbReleaseNotes";
            this.rtbReleaseNotes.ReadOnly = true;
            this.rtbReleaseNotes.ScrollBars = System.Windows.Forms.RichTextBoxScrollBars.Vertical;
            this.rtbReleaseNotes.Size = new System.Drawing.Size(470, 120);
            this.rtbReleaseNotes.TabIndex = 5;
            this.rtbReleaseNotes.Text = "Loading release notes...";
            // 
            // btnLater
            // 
            this.btnLater.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.btnLater.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.btnLater.Location = new System.Drawing.Point(300, 380);
            this.btnLater.Name = "btnLater";
            this.btnLater.Size = new System.Drawing.Size(90, 35);
            this.btnLater.TabIndex = 6;
            this.btnLater.Text = "Later";
            this.btnLater.UseVisualStyleBackColor = true;
            // 
            // btnUpdateNow
            // 
            this.btnUpdateNow.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btnUpdateNow.Location = new System.Drawing.Point(395, 380);
            this.btnUpdateNow.Name = "btnUpdateNow";
            this.btnUpdateNow.Size = new System.Drawing.Size(110, 35);
            this.btnUpdateNow.TabIndex = 7;
            this.btnUpdateNow.Text = "Update Now";
            this.btnUpdateNow.UseVisualStyleBackColor = true;
            this.btnUpdateNow.Click += new System.EventHandler(this.btnUpdateNow_Click);
            // 
            // lblTitle
            // 
            this.lblTitle.AutoSize = true;
            this.lblTitle.Font = new System.Drawing.Font("Segoe UI", 18F, System.Drawing.FontStyle.Bold);
            this.lblTitle.Location = new System.Drawing.Point(20, 20);
            this.lblTitle.Name = "lblTitle";
            this.lblTitle.Size = new System.Drawing.Size(315, 32);
            this.lblTitle.TabIndex = 8;
            this.lblTitle.Text = "Software Update Available";
            // 
            // lblDescription
            // 
            this.lblDescription.AutoSize = true;
            this.lblDescription.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.lblDescription.Location = new System.Drawing.Point(22, 65);
            this.lblDescription.MaximumSize = new System.Drawing.Size(460, 0);
            this.lblDescription.Name = "lblDescription";
            this.lblDescription.Size = new System.Drawing.Size(422, 19);
            this.lblDescription.TabIndex = 9;
            this.lblDescription.Text = "A new version of MFC Youth Area Management System is available.";
            // 
            // lblStatus
            // 
            this.lblStatus.AutoSize = true;
            this.lblStatus.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.lblStatus.ForeColor = System.Drawing.SystemColors.GrayText;
            this.lblStatus.Location = new System.Drawing.Point(20, 360);
            this.lblStatus.Name = "lblStatus";
            this.lblStatus.Size = new System.Drawing.Size(154, 15);
            this.lblStatus.TabIndex = 10;
            this.lblStatus.Text = "Ready to download update";
            this.lblStatus.Visible = false;

            // 
            // UpdateAvailableForm
            // 
            this.AcceptButton = this.btnUpdateNow;
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.CancelButton = this.btnLater;
            this.ClientSize = new System.Drawing.Size(504, 420);
            this.Controls.Add(this.lblDescription);
            this.Controls.Add(this.lblStatus);
            this.Controls.Add(this.lblTitle);
            this.Controls.Add(this.btnUpdateNow);
            this.Controls.Add(this.btnLater);
            this.Controls.Add(this.rtbReleaseNotes);
            this.Controls.Add(this.lblReleaseNotes);
            this.Controls.Add(this.lblLatestVersionValue);
            this.Controls.Add(this.lblLatestVersion);
            this.Controls.Add(this.lblCurrentVersionValue);
            this.Controls.Add(this.lblCurrentVersion);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "UpdateAvailableForm";
            this.ShowIcon = false;
            this.ShowInTaskbar = false;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
            this.Text = "Software Update";
            this.Load += new System.EventHandler(this.UpdateAvailableForm_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label lblCurrentVersion;
        private System.Windows.Forms.Label lblCurrentVersionValue;
        private System.Windows.Forms.Label lblLatestVersion;
        private System.Windows.Forms.Label lblLatestVersionValue;
        private System.Windows.Forms.Label lblReleaseNotes;
        private System.Windows.Forms.RichTextBox rtbReleaseNotes;
        private System.Windows.Forms.Button btnLater;
        private System.Windows.Forms.Button btnUpdateNow;
        private System.Windows.Forms.Label lblTitle;
        private System.Windows.Forms.Label lblDescription;
        private System.Windows.Forms.Label lblStatus;
    }
}